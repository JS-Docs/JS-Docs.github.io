document.addEventListener('DOMContentLoaded', () => {
    // 最初に管理用のJSONから記事一覧を自動取得
    loadArticleList();

    // 戻るボタンのイベント
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('article-detail-section').classList.add('hidden');
        document.getElementById('article-list-section').classList.remove('hidden');
        window.location.hash = '';
    });

    // URLハッシュ（#）による直接アクセス・画面切り替え対応
    window.addEventListener('hashchange', checkHash);
});

// JSONファイルを読み込んで、note風の一覧カードを自動生成
async function loadArticleList() {
    const listContainer = document.getElementById('article-list');
    try {
        // list.jsonから登録されている記事リストを自動取得
        const response = await fetch('list.json');
        if (!response.ok) throw new Error('記事リスト(list.json)の読み込みに失敗しました');
        
        const articles = await response.json();
        listContainer.innerHTML = '';

        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <h3>${article.title}</h3>
                <p class="post-desc">${article.description || ''}</p>
            `;
            // クリックされたらハッシュ（#）を記事IDに変更
            card.addEventListener('click', () => {
                window.location.hash = encodeURIComponent(article.id);
            });
            listContainer.appendChild(card);
        });

        // ページを開いたときにすでにハッシュがあれば詳細を表示
        checkHash();
    } catch (error) {
        listContainer.innerHTML = `<p style="color:red;">エラー: ${error.message}</p>`;
    }
}

// ハッシュを監視して画面を切り替える
function checkHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const articleId = decodeURIComponent(hash);
        loadArticleData(articleId);
    } else {
        // ハッシュがない場合は一覧を表示
        document.getElementById('article-detail-section').classList.add('hidden');
        document.getElementById('article-list-section').classList.remove('hidden');
    }
}

// 特定の記事データをsrcフォルダから読み込んで表示
async function loadArticleData(articleId) {
    const contentBody = document.getElementById('post-content');
    contentBody.innerHTML = '<p class="loading">記事を読み込み中...</p>';

    try {
        // 1. もう一度list.jsonから対象の記事のファイル名（fileName）を探す
        const listResponse = await fetch('list.json');
        const articles = await listResponse.json();
        const article = articles.find(a => a.id === articleId);

        if (!article) throw new Error('指定された記事が見つかりません');

        document.getElementById('post-title').innerText = article.title;

        // 2. src/フォルダ内にある実際のMarkdownファイルを取得
        const fileResponse = await fetch(`src/${article.fileName}`);
        if (!fileResponse.ok) throw new Error(`${article.fileName} の読み込みに失敗しました`);
        
        const markdownText = await fileResponse.text();

        // 3. Marked.jsでMarkdownをHTMLに変換して流し込む
        contentBody.innerHTML = marked.parse(markdownText);

        // 4. コードブロックをPrism.jsで色分け（シンタックスハイライト）
        Prism.highlightAllUnder(contentBody);

        // 画面の切り替え
        document.getElementById('article-list-section').classList.add('hidden');
        document.getElementById('article-detail-section').classList.remove('hidden');
        window.scrollTo(0, 0);

    } catch (error) {
        contentBody.innerHTML = `<p style="color:red;">エラー: ${error.message}</p>`;
    }
}