# frontend

当前前端没有单独拆文件。

实际入口在：

- `services/webchat/server.py`

也就是说，当前 UI 调整主要改这里：

- HTML：`INDEX_HTML`
- CSS：`<style>...</style>`
- 前端交互：`<script>...</script>`

如果后面要真正模块化，这个目录建议拆成：

- `index.html`
- `styles.css`
- `app.js`
