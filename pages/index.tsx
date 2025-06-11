

// pages/index.tsx
import { useState } from "react";
import { fetchProduct, sendPurchase } from "../lib/api";
import { Html5QrcodeScanner } from "html5-qrcode";


type Item = {
  code: string;
  name: string;
  price: number;
  qty: number; // ← 追加！
  tax_cd: string; // ← 消費税区分（例："08", "10"）
};

export default function POSPage() {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false); // ← スキャン中状態
  const [product, setProduct] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.floor(subtotal * 0.1); // 10%消費税（端数切り捨て）
  const caltotal = subtotal + tax;

  const handleSearch = async () => {
    setError("");
    try {
      const data = await fetchProduct(code);
      setProduct(data);
    } catch (e: any) {
      setProduct(null);
      setError(e.message);
    }
  };

  // const handleAdd = () => {
  //   if (product) {
  //     setItems([...items, product]);
  //     setProduct(null);
  //     setCode("");
  //   }
  // };

  const handleAdd = () => {
  if (!product) return;
  const existingIndex = items.findIndex((item) => item.code === product.code);
  if (existingIndex !== -1) {
    // 同じ商品がすでにある → 数量+1
    const updatedItems = [...items];
    updatedItems[existingIndex].qty += 1;
    setItems(updatedItems);
  } else {
    // 初めての追加 → qty:1 で追加
    setItems([...items, { ...product, qty: 1 }]);
  }
  setProduct(null);
  setCode("");
};


  const handlePurchase = async () => {
    try {
      const payload = {
        emp_cd: "9999999999",
        store_cd: "30",
        pos_no: "90",
        items: items.map((item) => ({
          code: item.code,
          name: item.name,
          price: item.price,
          qty: item.qty,
          tax_cd: item.tax_cd,
        })),
        ttl_amt_ex_tax: items.reduce((sum, item) => sum + item.price * item.qty, 0)
      };

      const response = await fetch(process.env.NEXT_PUBIC_API_ENDPOINT + "/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("購入に失敗しました");

    setItems([]);
    setTotal(null);
    alert("購入完了！");
      // setTotal(res.total);
      // setItems([]);
    } catch (e: any) {
      setError(e.message);
      }
  };

  const startScanner = () => {
    setScanning(true);
    const scanner = new Html5QrcodeScanner(
    "reader",
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    } as any,
    false
  );

  scanner.render(
    (text) => {
      setCode(text);         // 読み取ったバーコードを state に反映
      scanner.clear();       // スキャナー停止
      setScanning(false);
    },
    (err) => {
      console.warn(err);
    }
  );
};

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>POSレジ</h1>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="商品コードを入力"
      />
      <button onClick={handleSearch}>読み取り</button>
      <button onClick={startScanner}>スキャン（カメラ）</button>
      {scanning && <div id="reader" style={{ width: "300px" }} />}

      {product && (
        <div>
          <p>商品名: {product.name}</p>
          <p>価格: ¥{product.price}</p>
          <button onClick={handleAdd}>追加</button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>購入リスト</h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            {item.name} - ¥{item.price} × {item.qty} = ¥{item.price * item.qty}
  （税区分: {item.tax_cd}）
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <>
          <button onClick={handlePurchase}>購入する</button>

        {/* 合計金額（数量を考慮） */}
        <h3>税抜合計: ¥{subtotal}</h3>
        <h3>消費税 (10%): ¥{tax}</h3>
        <h2>合計金額: ¥{caltotal}</h2>
      </>
    )}
    </div>
  );
}
