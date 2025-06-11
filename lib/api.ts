// lib/api.ts
export const fetchProduct = async (code: string) => {
  const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT + `/products/${code}`);
  if (!res.ok) throw new Error("商品が見つかりません");

  const data = await res.json();

  return {
    code: data.code,
    name: data.name,
    price: data.price,
    tax_cd: data.tax_cd, // ← tax_cd を明示的に取得
    qty: 1
  };
};


export async function sendPurchase(data: any) {
  const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT + "/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("購入に失敗しました");
  return res.json();
}
