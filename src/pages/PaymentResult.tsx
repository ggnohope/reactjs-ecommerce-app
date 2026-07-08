import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Reveal from "../components/Reveal";

export default function PaymentResult({ status }: { status: "success" | "cancel" }) {
  const queryClient = useQueryClient();
  const success = status === "success";

  useEffect(() => {
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  }, [success, queryClient]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Reveal>
        <p className="label-mono mb-2 text-ink-soft">PayOS</p>
        {success ? (
          <>
            <p className="wonky-italic text-4xl text-moss">✓ Thanh toán thành công.</p>
            <p className="mt-4 text-sm text-ink-soft">
              Cảm ơn bạn. Đơn hàng sẽ được cập nhật trạng thái trong giây lát.
            </p>
          </>
        ) : (
          <>
            <p className="wonky-italic text-4xl text-vermillion">Thanh toán đã bị hủy.</p>
            <p className="mt-4 text-sm text-ink-soft">
              Bạn có thể quay lại đơn hàng và thử thanh toán lại bất cứ lúc nào.
            </p>
          </>
        )}
        <Link
          to="/orders"
          className="label-mono link-underline mt-6 inline-block text-vermillion"
        >
          ← Về đơn hàng
        </Link>
      </Reveal>
    </div>
  );
}
