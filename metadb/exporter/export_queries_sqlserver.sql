/* SQL Server Exporter Queries (Contract) */
-- Required: WHERE PJ_ID = @ProjectId AND _DeleteDate IS NULL (where applicable).

-- Q_LANGUAGES
SELECT DISTINCT LG_Code AS code
FROM Meta.Language
WHERE _DeleteDate IS NULL
ORDER BY LG_Code;

-- Q_UI_THEMES
SELECT UT_ID AS id, UT_Code AS code, UT_TokensJSON AS tokensJson, UT_TextKeyID AS textKeyId, UT_IsEnabled AS isEnabled
FROM Meta.UiTheme
WHERE PJ_ID = @ProjectId AND _DeleteDate IS NULL
ORDER BY UT_ID;
