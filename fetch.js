const fs = require("fs");

const SCHOOL_ID = "64736873";

async function main() {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
  }).format(new Date());

  console.log("日期:", today);

  const mealUrl =
    `https://fatraceschool.k12ea.gov.tw/offered/meal` +
    `?SchoolId=${SCHOOL_ID}` +
    `&period=${today}` +
    `&KitchenId=all` +
    `&MenuType=1`;

  console.log("查詢:", mealUrl);

  let mealJson;
  
  // 🚨 核心改進：把容易斷線的 fetch 用 try...catch 包起來
  try {
    const mealRes = await fetch(mealUrl);
    mealJson = await mealRes.json();
  } catch (error) {
    console.error("❌ 網路連線失敗（可能遭教育部阻擋或伺服器斷線）:", error.message);
    // 連不上的時候，自動寫入一個安全的 JSON，確保 Widget 不會壞掉
    writeFallbackJson(today, "🍱 暫無資料", "無法連線至食材登錄台");
    return;
  }

  // 如果找不到今天資料，或是回傳的日期不是今天
  if (!mealJson.data || mealJson.data.length === 0 || mealJson.data[0].MenuDate !== today) {
    console.log("ℹ️ 今天查無供餐資料，切換為假日模式");
    writeFallbackJson(today, "高雄市楠梓區加昌國小", "今天沒有供餐");
    return;
  }

  const meal = mealJson.data[0];
  const batchId = meal.BatchDataId;
  console.log("BatchDataId:", batchId);

  // STEP 2：取得菜色
  const dishUrl = `https://fatraceschool.k12ea.gov.tw/dish?BatchDataId=${batchId}`;
  console.log("查詢菜色:", dishUrl);

  let dishJson;
  try {
    const dishRes = await fetch(dishUrl);
    dishJson = await dishRes.json();
  } catch (error) {
    console.error("❌ 取得詳細菜色失敗:", error.message);
    writeFallbackJson(today, meal.SchoolName, "菜單細節讀取失敗");
    return;
  }

  // STEP 3：整理結果
  const result = {
    school: meal.SchoolName,
    date: meal.MenuDate,
    calorie: meal.Calorie,
    menu: dishJson.data.map((d) => ({
      type: d.DishType || "其他",
      name: d.DishName,
    })),
  };

  // STEP 4：輸出 JSON
  fs.writeFileSync("lunch.json", JSON.stringify(result, null, 2), "utf8");
  console.log("\nlunch.json 已成功更新最新菜單！");
}

// 輔助函式：當網路壞掉或沒資料時，產出安全的預設 JSON
function writeFallbackJson(date, schoolName, message) {
  const result = {
    school: schoolName,
    date: date,
    holiday: true,
    message: message
  };
  fs.writeFileSync("lunch.json", JSON.stringify(result, null, 2), "utf8");
  console.log("💾 已寫入安全備份 lunch.json 檔案");
}

main().catch(console.error);
