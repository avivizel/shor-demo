# פריסה ל-IBM Cloud Code Engine

האפליקציה פרוסה כאפליקציה **פרטית** (`--visibility=private`). אין לה כתובת ציבורית ואין בה כניסת משתמשים, לכן אסור להפוך אותה לציבורית בלי שכבת הזדהות לפניה.

אישור החריג לקשירה בתוך הקונטיינר ניתן בכתב על ידי בעל האבטחה. ה-Dockerfile קושר רק ל-`127.0.0.1` ולכתובת ה-IP של הקונטיינר, ולא ל-`0.0.0.0`.

## דרישות מוקדמות

- `ibmcloud` CLI עם התוסף `code-engine`
- פרויקט Code Engine שבו `Application Private Visibility Supported` הוא `true`:
  `ibmcloud ce project get -n <project>`

## שלבים

הרצו בטרמינל שלכם. את מפתחות ה-API לא מדביקים בצ'אט ולא שומרים בקוד.

```powershell
ibmcloud login --sso
ibmcloud target -r us-south -g <resource-group>
ibmcloud ce project select -n <project>

# קובץ סודות מחוץ לגיט (.env כבר ב-.gitignore). שורות בפורמט KEY=VALUE:
#   WATSONX_API_KEY=...
#   WATSONX_PROJECT_ID=...
ibmcloud ce secret create --name shor-demo-secrets --from-env-file .env

ibmcloud ce app create --name shor-demo `
  --build-source https://github.com/avivizel/shor-demo `
  --build-strategy dockerfile `
  --build-size large `
  --port 8080 `
  --cpu 1 --memory 2G `
  --min-scale 0 --max-scale 2 `
  --visibility private `
  --env-from-secret shor-demo-secrets
```

## בדיקה

```powershell
ibmcloud ce app get --name shor-demo
ibmcloud ce app logs --name shor-demo
```

הגישה לכתובת הפרטית היא רק מתוך רשת פרטית של IBM Cloud, למשל דרך Virtual Private Endpoint ב-VPC.

## עדכון אחרי שינוי בקוד

```powershell
ibmcloud ce app update --name shor-demo --build-source https://github.com/avivizel/shor-demo --build-strategy dockerfile
```

## החלפת מפתח

```powershell
ibmcloud ce secret update --name shor-demo-secrets --from-env-file .env
ibmcloud ce app update --name shor-demo --env-from-secret shor-demo-secrets
```
