export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 設定允許跨域的 Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, EQ-Agent",
    };

    // 處理預檢請求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. 💡 路由 A：如果前端呼叫 /fetchData，就執行 cURL 數據轉發
    if (url.pathname === "/fetchData" && request.method === "POST") {
      const targetUrl = "http://eq.kyhtech.com/hapi/do.action?l=1";
      
      const targetResponse = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept-Encoding": "gzip",
          "Accept-Language": "zh_TW",
          "User-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null",
          "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
        },
        body: "action=eQndsAll&filter_GEN_mg=All&lang=zh_CN&page.order=DESC&page.orderBy=dateTime&page.pageNo=1&page.pageSize=20&pn=com.topstcn.eq&time=month&type=USGS&vcod=346"
      });

      const responseData = await targetResponse.text();
      return new Response(responseData, {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" }
      });
    }

    // 3. 路由 B：預設防禦，如果找不到對應
    return new Response("Not Found", { status: 404 });
  }
};