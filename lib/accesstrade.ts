export type AccessTradeTransaction = {
  id?: string;
  transaction_id?: string;

  merchant?: string;

  status?: number | string;

  is_confirmed?: number | boolean;

  click_time?: string;
  transaction_time?: string;
  update_time?: string;
  confirmed_time?: string;

  transaction_value?: number | string;
  commission?: number | string;

  product_id?: string;
  product_price?: number | string;
  product_quantity?: number | string;

  product_name?: string;
  product_category?: string;
  category_name?: string;
  product_image?: string;

  conversion_id?: string | number;
  conversion_platform?: string;
  customer_type?: string;

  reason_reject?: string;

  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;

  _extra?: unknown;

  [key: string]: unknown;
};

export type TrackingMatch = {
  trackingId: string;
  source: string;
  value?: string;
};

/**
 * Decode URL nhiều lần vì ACCESSTRADE/TikTok
 * có thể lồng URL trong query parameter.
 */
function decodeRepeatedly(value: string): string[] {
  const results = new Set<string>();

  let current = value;

  for (let i = 0; i < 4; i++) {
    results.add(current);

    try {
      const decoded = decodeURIComponent(current);

      if (decoded === current) {
        break;
      }

      current = decoded;
    } catch {
      break;
    }
  }

  return [...results];
}

/**
 * Tìm các giá trị tracking phổ biến trong object.
 */
function collectTrackingValues(
  value: unknown,
  path: string,
  output: Array<{
    key: string;
    value: string;
    path: string;
  }>
) {
  if (value === null || value === undefined) {
    return;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const stringValue = String(value);

    const lowerPath = path.toLowerCase();

    const isTrackingField =
      lowerPath.endsWith("tracking_id") ||
      lowerPath.endsWith("trackingid") ||
      lowerPath.endsWith("sub1") ||
      lowerPath.endsWith("sub_1") ||
      lowerPath.endsWith("subid1") ||
      lowerPath.endsWith("sub_id1") ||
      lowerPath.endsWith("sub_id") ||
      lowerPath.endsWith("utm_content");

    if (isTrackingField) {
      output.push({
        key: path.split(".").pop() || path,
        value: stringValue,
        path,
      });
    }

    /*
     * Nếu value là URL, bóc query params.
     */
    if (
      stringValue.startsWith("http://") ||
      stringValue.startsWith("https://")
    ) {
      for (const decoded of decodeRepeatedly(
        stringValue
      )) {
        try {
          const parsed = new URL(decoded);

          for (const [
            key,
            paramValue,
          ] of parsed.searchParams.entries()) {
            const lowerKey =
              key.toLowerCase();

            if (
              lowerKey === "sub1" ||
              lowerKey === "sub_1" ||
              lowerKey === "subid1" ||
              lowerKey === "sub_id1" ||
              lowerKey === "sub_id" ||
              lowerKey === "tracking_id" ||
              lowerKey === "trackingid" ||
              lowerKey === "utm_content"
            ) {
              output.push({
                key,
                value: paramValue,
                path: `${path}.url.${key}`,
              });
            }

            /*
             * Một số link có URL lồng bên trong
             * parameter "url".
             */
            if (
              lowerKey === "url" ||
              lowerKey === "redirect" ||
              lowerKey === "redirect_url" ||
              lowerKey === "click_url"
            ) {
              for (const nested of decodeRepeatedly(
                paramValue
              )) {
                collectTrackingValues(
                  nested,
                  `${path}.url.${key}`,
                  output
                );
              }
            }
          }
        } catch {
          // Không phải URL hợp lệ → bỏ qua.
        }
      }
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectTrackingValues(
        item,
        `${path}[${index}]`,
        output
      );
    });

    return;
  }

  if (typeof value === "object") {
    for (const [
      key,
      child,
    ] of Object.entries(
      value as Record<string, unknown>
    )) {
      collectTrackingValues(
        child,
        path ? `${path}.${key}` : key,
        output
      );
    }
  }
}

/**
 * Tìm tracking_id thực sự thuộc hệ thống
 * trong transaction ACCESSTRADE.
 *
 * Không tự đoán tracking ID.
 */
export function findTrackingMatch(
  transaction: AccessTradeTransaction,
  knownTrackingIds: Set<string>
): TrackingMatch | null {
  const values: Array<{
    key: string;
    value: string;
    path: string;
  }> = [];

  collectTrackingValues(
    transaction,
    "",
    values
  );

  /*
   * Ưu tiên những field có tên tracking/sub/utm.
   */
  for (const item of values) {
    if (
      knownTrackingIds.has(item.value)
    ) {
      return {
        trackingId: item.value,
        source: item.path,
        value: item.value,
      };
    }
  }

  /*
   * Fallback an toàn:
   * kiểm tra transaction JSON có chứa
   * chính xác tracking ID nào không.
   *
   * Không tạo order nếu không match.
   */
  const serialized =
    JSON.stringify(transaction);

  for (const trackingId of knownTrackingIds) {
    if (serialized.includes(trackingId)) {
      return {
        trackingId,
        source: "transaction.raw",
        value: trackingId,
      };
    }
  }

  return null;
}

/**
 * Map status ACCESSTRADE → status orders.
 *
 * ACCESSTRADE:
 * 0 = pending/hold
 * 1 = approved
 * 2 = rejected
 */
export function mapTransactionStatus(
  status: unknown
): "pending" | "approved" | "rejected" {
  const numericStatus =
    Number(status);

  if (numericStatus === 1) {
    return "approved";
  }

  if (numericStatus === 2) {
    return "rejected";
  }

  return "pending";
}