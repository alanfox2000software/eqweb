export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 設定允許前端（本地或 GitHub Pages）跨域的 CORS Headers
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
      try {
        // 🎯 修正：1=1 (數字 1)
        const targetUrl = "http://eq.kyhtech.com/hapi/do.action?1=1";
        
        // 🎯 100% 還原 --data-raw 參數字串，確保拼字完全一致
        const rawBody = "action=eqAndsAll&filter_GEN_mg=All&lang=zh_CN&page.order=DESC&page.orderBy=dateTime&page.pageNo=1&page.pageSize=20&pn=com.topstcn.eq&time=month&type=USGS&vcode=346";

        const targetResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Connection": "Keep-Alive",
            "Accept-Language": "zh_TW",
            // 🔐 讓 User-Agent 與新 cURL 的 EQ-Agent 保持完全同步 (包含 3.6.1_346 的底線)
            "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1_346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
          },
          body: rawBody
        });

        // 讀取目標伺服器返回的原始資料
        const responseData = await targetResponse.text();

        // 安全網：如果對方的後端依然噴出 HTML 網頁，將其攔截並輸出除錯資訊
        if (responseData.trim().startsWith("<!DOCTYPE") || responseData.trim().startsWith("<html")) {
          return new Response(JSON.stringify({ 
            status: "error", 
            message: "目標伺服器返回了 HTML，請確認參數或是否遭到 WAF 機房 IP 封鎖。",
            debug_raw: responseData.substring(0, 300) 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" }
          });
        }
        
        // 順利拿到 JSON，加上 CORS 還給前端網頁
        return new Response(responseData, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=UTF-8"
          }
        });

      } catch (err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" }
        });
      }
    }

    // 預設防禦路由
    return new Response("Not Found", { status: 404 });
  }
};