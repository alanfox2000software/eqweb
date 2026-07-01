export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/fetchData" && request.method === "POST") {
      try {
        const targetUrl = "http://eq.kyhtech.com/hapi/do.action?l=1";
        
        const targetResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept-Language": "zh_TW",
            // 🔐 保持與 cURL 一致的設備驗證
            "User-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null",
            "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
          },
          body: "action=eQndsAll&filter_GEN_mg=All&lang=zh_CN&page.order=DESC&page.orderBy=dateTime&page.pageNo=1&page.pageSize=20&pn=com.topstcn.eq&time=month&type=USGS&vcod=346"
        });

        // 💡 讀取目標伺服器返回的原始文字
        const responseData = await targetResponse.text();

        // 檢查是不是拿到了壞掉的網頁 HTML (例如對方的 500 錯誤頁面)
        if (responseData.trim().startsWith("<!DOCTYPE") || responseData.trim().startsWith("<html")) {
          return new Response(JSON.stringify({ 
            status: "error", 
            message: "目標伺服器返回了 HTML 網頁而非 JSON 數據，可能是防爬蟲封鎖。",
            debug_raw: responseData.substring(0, 200) 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" }
          });
        }
        
        // 正常回傳
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

    return new Response("Not Found", { status: 404 });
  }
};