export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 設定允許前端（本地與 GitHub Pages）跨域的 CORS 請求頭
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 處理瀏覽器的預檢請求 (Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. 當前端訪問 /fetchData 路由時執行轉發
    if (url.pathname === "/fetchData" && request.method === "POST") {
      
      // 🎯 100% 對應你的 cURL 網址
      const targetUrl = "http://eq.kyhtech.com/hapi/do.action?l=1";
      
      // 🎯 100% 對應你的 cURL Headers (-H) 與 Body (-d)
      const targetResponse = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept-Encoding": "gzip",
          "Accept-Language": "zh_TW",
          // 🔐 關鍵：在雲端將 User-Agent 偽裝成與你的 EQ-Agent 一致的手機 App 特徵
          "User-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null",
          "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
        },
        // 🎯 100% 對應你的 cURL 資料數據 (-d)
        body: "action=eQndsAll&filter_GEN_mg=All&lang=zh_CN&page.order=DESC&page.orderBy=dateTime&page.pageNo=1&page.pageSize=20&pn=com.topstcn.eq&time=month&type=USGS&vcod=346"
      });

      // 讀取目標伺服器返回的原始文字
      const responseData = await targetResponse.text();
      
      // 注入 CORS 放行標頭，高高興興地還給前端網頁
      return new Response(responseData, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=UTF-8"
        }
      });
    }

    // 預設防禦路由
    return new Response("Not Found", { status: 404 });
  }
};