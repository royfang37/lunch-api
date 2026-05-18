const fs = require("fs");

const SCHOOL_ID = "64736873";

async function main() {
  // 台灣日期
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
  }).format(new Date());

  console.log("日期:", today);

  // STEP 1：取得菜單
  const mealUrl =
    `https://fatraceschool.k12ea.gov.tw/offered/meal` +
    `?SchoolId=${SCHOOL_ID}` +
    `&period=${today}` +
    `&KitchenId=all` +
    `&MenuType=1`;

  console.log("查詢:", mealUrl);

  const mealRes = await fetch(mealUrl);
  const mealJson = await mealRes.json();

  if (!mealJson.data || mealJson.data.length === 0) {

  const result = {
    school: "高雄市楠梓區加昌國小",
    date: today,
    holiday: true,
    message: "今天沒有供餐"
  };

  fs.writeFileSync(
    "lunch.json",
    JSON.stringify(result, null, 2),
    "utf8"
  );

  console.log("今天沒有供餐");
  console.log("lunch.json 已更新");

  return;
}

  const meal = mealJson.data[0];

  const batchId = meal.BatchDataId;

  console.log("BatchDataId:", batchId);

  // STEP 2：取得菜色
  const dishUrl =
    `https://fatraceschool.k12ea.gov.tw/dish?BatchDataId=${batchId}`;

  console.log("查詢菜色:", dishUrl);

  const dishRes = await fetch(dishUrl);
  const dishJson = await dishRes.json();

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
  fs.writeFileSync(
    "lunch.json",
    JSON.stringify(result, null, 2),
    "utf8"
  );

  console.log("\n===== 今日午餐 =====");
  console.log(JSON.stringify(result, null, 2));

  console.log("\nlunch.json 已更新");
}

main().catch(console.error);
