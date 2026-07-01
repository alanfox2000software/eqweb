export async function onRequest(context) {
  // 1. 設定允許你的前端網頁跨域的 CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, EQ-Agent",
  };

  // 2. 處理瀏覽器的預檢請求 (Preflight Options)
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 3. 處理網頁端發過來的 POST 請求
  if (context.request.method === "POST") {
    const targetUrl = "http://eq.kyhtech.com/hapi/do.action?l=1";
    
    // 🔐 在 Cloudflare 後端偽裝成手機 cURL 環境，繞過對方的瀏覽器阻斷
    const targetResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept-Encoding": "gzip",
        "Accept-Language": "zh_TW",
        "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
      },
      body: "action=eQndsAll&filter_GEN_mg=All&lang=zh_CN&page.order=DESC&page.orderBy=dateTime&page.pageNo=1&page.pageSize=20&pn=com.topstcn.eq&time=month&type=USGS&vcod=346"
    });

    // 取得地震伺服器回傳的原始 JSON 資料
    const responseData = await targetResponse.text();
    
    // 加上 CORS 放行標頭，回傳給你的前端
    return new Response(responseData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
  }

  return new Response("請使用 POST 請求", { status: 400 });
}