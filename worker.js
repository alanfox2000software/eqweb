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
        // 📥 接收來自前端網頁傳過來的自訂篩選參數
        const clientJson = await request.json().catch(() => ({}));
        
        // 預設參數與提取
        const time = clientJson.time || "month";
        const mg = clientJson.mg || "All";
        const type = clientJson.type || "USGS";
        const regionParams = clientJson.regionParams || ""; // 格式：&filter_GEN_lat=...

        const targetUrl = "http://eq.kyhtech.com/hapi/do.action?1=1";
        
        // 🎯 基礎必需參數（100% 還原你測試成功的 cURL 特徵）
        let baseBody = `action=eqAndsAll&filter_GEN_mg=${mg}&lang=zh_CN&page.order=DESC&page.orderBy=dateTime&page.pageNo=1&page.pageSize=50&pn=com.topstcn.eq&time=${time}&type=${type}&vcode=346`;
        
        // 🎯 如果有選擇特定區域，將區域經緯度範圍參數拼接上去
        if (regionParams) {
          baseBody += regionParams;
        }

        const targetResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Connection": "Keep-Alive",
            "Accept-Language": "zh_TW",
            "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1_346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
          },
          body: baseBody
        });

        const responseData = await targetResponse.text();

        // 攔截防護牆 HTML 錯誤頁面
        if (responseData.trim().startsWith("<!DOCTYPE") || responseData.trim().startsWith("<html")) {
          return new Response(JSON.stringify({ 
            status: "error", 
            message: "目標伺服器返回了 HTML，請稍後再試。",
            debug_raw: responseData.substring(0, 200) 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" }
          });
        }
        
        return new Response(responseData, {
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" }
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