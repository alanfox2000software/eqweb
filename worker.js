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
        
        // 💡 核心修正：改用標準的 URLSearchParams 物件封裝參數
        // 這會強制 Cloudflare 發送最標準、帶有正確長度與邊界的表單格式
        const searchParams = new URLSearchParams();
        searchParams.append("action", "eQndsAll");
        searchParams.append("filter_GEN_mg", "All");
        searchParams.append("lang", "zh_CN");
        searchParams.append("page.order", "DESC");
        searchParams.append("page.orderBy", "dateTime");
        searchParams.append("page.pageNo", "1");
        searchParams.append("page.pageSize", "20");
        searchParams.append("pn", "com.topstcn.eq");
        searchParams.append("time", "month");
        searchParams.append("type", "USGS");
        searchParams.append("vcod", "346");

        const targetResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8",
            // 🔐 嚴格偽裝成標準的 Dalvik 虛擬機器環境（App 常見特徵），不帶任何瀏覽器痕跡
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; SM-A156E Build/SP1A.210812.016)",
            "EQ-Agent": "GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null"
          },
          body: searchParams // 💡 傳入處理過的參數物件
        });

        const responseData = await targetResponse.text();

        // 判定攔截
        if (responseData.trim().startsWith("<!DOCTYPE") || responseData.trim().startsWith("<html")) {
          return new Response(JSON.stringify({ 
            status: "error", 
            message: "目標伺防護牆攔截了機房IP，請嘗試重新編譯部署。",
            debug_raw: responseData.substring(0, 150) 
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