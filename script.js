class DataOrganizer {
    constructor() {
        this.rawData = null;
        this.processedData = null;
        this.constants = {};
        this.genres = {};
        this.dataTypes = {};
        this.stats = {};
        this.keywordAnalysis = {};
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeData());
        document.getElementById('sampleBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadData());
        document.getElementById('outputFormat').addEventListener('change', () => this.updateOrganizedDisplay());
    }

    loadSampleData() {
        const format = document.getElementById('dataFormat').value;
        const sampleData = {
            csv: `名前,年齢,職業,住所,給与
田中太郎,25,エンジニア,東京都,450000
佐藤花子,30,デザイナー,大阪府,380000
山田次郎,28,営業,東京都,420000
鈴木一郎,35,エンジニア,神奈川県,520000
高橋美咲,27,デザイナー,東京都,400000`,
            json: `[
    {"名前": "田中太郎", "年齢": 25, "職業": "エンジニア", "住所": "東京都", "給与": 450000},
    {"名前": "佐藤花子", "年齢": 30, "職業": "デザイナー", "住所": "大阪府", "給与": 380000},
    {"名前": "山田次郎", "年齢": 28, "職業": "営業", "住所": "東京都", "給与": 420000},
    {"名前": "鈴木一郎", "年齢": 35, "職業": "エンジニア", "住所": "神奈川県", "給与": 520000},
    {"名前": "高橋美咲", "年齢": 27, "職業": "デザイナー", "住所": "東京都", "給与": 400000}
]`,
            text: `田中太郎 25歳 エンジニア 東京都 P1定期A台
佐藤花子 30歳 デザイナー 大阪府 KOP1定期B台
山田次郎 28歳 営業 東京都 JOP定期A台
鈴木一郎 35歳 エンジニア 神奈川県 P1定期B台
高橋美咲 27歳 デザイナー 東京都 KOP1定期A台
山下健一 32歳 開発者 埼玉県 JOP定期B台
中村美香 29歳 マーケター 千葉県 P1定期A台
伊藤直樹 31歳 営業 神奈川県 KOP1定期B台
加藤さくら 26歳 企画 大阪府 JOP定期A台
渡辺健 33歳 開発 東京都 P1定期`
        };
        
        document.getElementById('dataInput').value = sampleData[format];
    }

    analyzeData() {
        const input = document.getElementById('dataInput').value.trim();
        const format = document.getElementById('dataFormat').value;
        
        if (!input) {
            alert('データを入力してください。');
            return;
        }

        try {
            this.rawData = this.parseData(input, format);
            this.processData();
            this.displayResults();
            document.querySelector('.results-section').style.display = 'block';
        } catch (error) {
            alert('データの解析に失敗しました: ' + error.message);
        }
    }

    parseData(input, format) {
        switch (format) {
            case 'csv':
                return this.parseCSV(input);
            case 'json':
                return JSON.parse(input);
            case 'text':
                return this.parseText(input);
            default:
                throw new Error('不明なデータ形式です');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        
        return data;
    }

    parseText(textData) {
        const lines = textData.split('\n').filter(line => line.trim());
        return lines.map((line, index) => ({
            'ID': index + 1,
            'データ': line.trim()
        }));
    }

    processData() {
        this.extractConstants();
        this.classifyGenres();
        this.analyzeDataTypes();
        this.calculateStats();
        this.extractKeywords();
        this.organizeData();
    }

    extractConstants() {
        this.constants = {};
        
        if (!Array.isArray(this.rawData) || this.rawData.length === 0) return;
        
        const keys = Object.keys(this.rawData[0]);
        
        keys.forEach(key => {
            const values = this.rawData.map(row => row[key]);
            const valueCount = {};
            
            values.forEach(value => {
                if (value !== undefined && value !== null && value !== '') {
                    valueCount[value] = (valueCount[value] || 0) + 1;
                }
            });
            
            const frequentValues = Object.entries(valueCount)
                .filter(([value, count]) => count >= 2)
                .sort((a, b) => b[1] - a[1]);
            
            if (frequentValues.length > 0) {
                this.constants[key] = frequentValues;
            }
        });
    }

    classifyGenres() {
        this.genres = {};
        
        if (!Array.isArray(this.rawData) || this.rawData.length === 0) return;
        
        const keys = Object.keys(this.rawData[0]);
        
        keys.forEach(key => {
            const values = this.rawData.map(row => row[key]).filter(v => v !== undefined && v !== null && v !== '');
            
            if (values.length === 0) return;
            
            const genres = this.determineGenre(key, values);
            this.genres[key] = genres;
        });
    }

    determineGenre(fieldName, values) {
        const patterns = {
            '個人情報': ['名前', 'name', '氏名', 'ユーザー', 'user'],
            '年齢・時間': ['年齢', 'age', '歳', '時間', 'time', '日付', 'date'],
            '職業・役職': ['職業', 'job', '仕事', '役職', '部署', 'department'],
            '場所・住所': ['住所', 'address', '場所', 'location', '都市', 'city', '県', '都'],
            '金額・数値': ['給与', 'salary', '金額', 'amount', '価格', 'price', '料金', 'fee'],
            '連絡先': ['電話', 'phone', 'tel', 'メール', 'mail', 'email'],
            'ID・コード': ['id', 'code', 'コード', '番号', 'number', 'no']
        };
        
        const fieldNameLower = fieldName.toLowerCase();
        
        for (const [genre, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => fieldNameLower.includes(keyword))) {
                return [genre];
            }
        }
        
        const firstValue = values[0];
        if (typeof firstValue === 'number' || !isNaN(Number(firstValue))) {
            return ['数値データ'];
        }
        
        if (values.every(v => typeof v === 'string' && v.length <= 10)) {
            return ['短いテキスト'];
        }
        
        return ['その他'];
    }

    analyzeDataTypes() {
        this.dataTypes = {};
        
        if (!Array.isArray(this.rawData) || this.rawData.length === 0) return;
        
        const keys = Object.keys(this.rawData[0]);
        
        keys.forEach(key => {
            const values = this.rawData.map(row => row[key]).filter(v => v !== undefined && v !== null && v !== '');
            
            if (values.length === 0) {
                this.dataTypes[key] = 'empty';
                return;
            }
            
            const types = {
                number: 0,
                string: 0,
                boolean: 0,
                date: 0
            };
            
            values.forEach(value => {
                if (typeof value === 'boolean') {
                    types.boolean++;
                } else if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
                    types.number++;
                } else if (this.isDate(value)) {
                    types.date++;
                } else {
                    types.string++;
                }
            });
            
            const maxType = Object.entries(types).reduce((a, b) => types[a[0]] > types[b[0]] ? a : b);
            this.dataTypes[key] = {
                primary: maxType[0],
                distribution: types,
                total: values.length
            };
        });
    }

    isDate(value) {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/,
            /^\d{4}\/\d{1,2}\/\d{1,2}$/,
            /^\d{1,2}\/\d{1,2}\/\d{4}$/
        ];
        
        return datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
    }

    calculateStats() {
        this.stats = {
            totalRecords: this.rawData.length,
            totalFields: Object.keys(this.rawData[0] || {}).length,
            uniqueValues: {},
            completeness: {}
        };
        
        if (this.rawData.length === 0) return;
        
        const keys = Object.keys(this.rawData[0]);
        
        keys.forEach(key => {
            const values = this.rawData.map(row => row[key]);
            const nonEmptyValues = values.filter(v => v !== undefined && v !== null && v !== '');
            const uniqueValues = [...new Set(nonEmptyValues)];
            
            this.stats.uniqueValues[key] = uniqueValues.length;
            this.stats.completeness[key] = Math.round((nonEmptyValues.length / this.rawData.length) * 100);
        });
    }

    extractKeywords() {
        this.keywordAnalysis = {
            keywords: ['P1', 'KOP1', 'JOP'],
            detailedCounts: {},
            totalCounts: {},
            extractedData: []
        };
        
        if (!Array.isArray(this.rawData) || this.rawData.length === 0) return;
        
        // 各キーワードの詳細集計を初期化
        this.keywordAnalysis.keywords.forEach(keyword => {
            this.keywordAnalysis.detailedCounts[keyword] = {
                'A台': 0,
                'B台': 0,
                'その他': 0,
                total: 0
            };
            this.keywordAnalysis.totalCounts[keyword] = 0;
        });
        
        this.keywordAnalysis.extractedData = this.extractDetailedKeywordData();
        
        // 総計を計算
        this.keywordAnalysis.grandTotal = Object.values(this.keywordAnalysis.totalCounts)
            .reduce((sum, count) => sum + count, 0);
    }

    extractDetailedKeywordData() {
        const extractedData = [];
        
        if (!Array.isArray(this.rawData) || this.rawData.length === 0) return extractedData;
        
        this.rawData.forEach((row, index) => {
            const rowText = Object.values(row).join(' ');
            const foundMatches = [];
            
            this.keywordAnalysis.keywords.forEach(keyword => {
                // キーワード + 定期 のパターンを検索
                const keywordRegex = new RegExp(`${keyword}定期`, 'gi');
                const keywordMatches = rowText.match(keywordRegex);
                
                if (keywordMatches) {
                    keywordMatches.forEach(match => {
                        // A台またはB台を検索
                        let category = 'その他';
                        if (rowText.includes('A台') || rowText.includes('A定期')) {
                            category = 'A台';
                        } else if (rowText.includes('B台') || rowText.includes('B定期')) {
                            category = 'B台';
                        }
                        
                        // カウントを更新
                        this.keywordAnalysis.detailedCounts[keyword][category]++;
                        this.keywordAnalysis.detailedCounts[keyword].total++;
                        this.keywordAnalysis.totalCounts[keyword]++;
                        
                        foundMatches.push({
                            keyword: keyword,
                            category: category,
                            fullMatch: match
                        });
                    });
                }
            });
            
            if (foundMatches.length > 0) {
                extractedData.push({
                    rowIndex: index + 1,
                    originalData: row,
                    foundMatches: foundMatches
                });
            }
        });
        
        return extractedData;
    }

    organizeData() {
        this.processedData = {
            constants: this.constants,
            genres: this.genres,
            dataTypes: this.dataTypes,
            stats: this.stats,
            keywordAnalysis: this.keywordAnalysis,
            originalData: this.rawData
        };
    }

    displayResults() {
        this.displayConstants();
        this.displayGenres();
        this.displayDataTypes();
        this.displayStats();
        this.displayKeywords();
        this.updateOrganizedDisplay();
    }

    displayConstants() {
        const container = document.getElementById('constantsResult');
        
        if (Object.keys(this.constants).length === 0) {
            container.innerHTML = '<p class="no-data">定数として抽出できるデータがありません</p>';
            return;
        }
        
        let html = '';
        Object.entries(this.constants).forEach(([field, values]) => {
            html += `<div class="constant-group">
                <h4>${field}</h4>
                <ul>`;
            values.forEach(([value, count]) => {
                html += `<li><code>${value}</code> <span class="count">(${count}回)</span></li>`;
            });
            html += `</ul></div>`;
        });
        
        container.innerHTML = html;
    }

    displayGenres() {
        const container = document.getElementById('genresResult');
        
        if (Object.keys(this.genres).length === 0) {
            container.innerHTML = '<p class="no-data">ジャンル分類できるデータがありません</p>';
            return;
        }
        
        let html = '';
        Object.entries(this.genres).forEach(([field, genres]) => {
            html += `<div class="genre-item">
                <strong>${field}</strong>: 
                <span class="genre-tags">${genres.map(g => `<span class="tag">${g}</span>`).join('')}</span>
            </div>`;
        });
        
        container.innerHTML = html;
    }

    displayDataTypes() {
        const container = document.getElementById('typesResult');
        
        if (Object.keys(this.dataTypes).length === 0) {
            container.innerHTML = '<p class="no-data">データ型を分析できませんでした</p>';
            return;
        }
        
        let html = '';
        Object.entries(this.dataTypes).forEach(([field, typeInfo]) => {
            if (typeof typeInfo === 'string') {
                html += `<div class="type-item">
                    <strong>${field}</strong>: <span class="type-badge">${typeInfo}</span>
                </div>`;
            } else {
                html += `<div class="type-item">
                    <strong>${field}</strong>: <span class="type-badge">${typeInfo.primary}</span>
                    <div class="type-distribution">
                        ${Object.entries(typeInfo.distribution)
                            .filter(([type, count]) => count > 0)
                            .map(([type, count]) => `<span class="type-detail">${type}: ${count}</span>`)
                            .join(', ')}
                    </div>
                </div>`;
            }
        });
        
        container.innerHTML = html;
    }

    displayStats() {
        const container = document.getElementById('statsResult');
        
        let html = `
            <div class="stat-item">
                <span class="stat-label">総レコード数:</span>
                <span class="stat-value">${this.stats.totalRecords}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">総フィールド数:</span>
                <span class="stat-value">${this.stats.totalFields}</span>
            </div>
            <h4>ユニーク値数</h4>`;
        
        Object.entries(this.stats.uniqueValues).forEach(([field, count]) => {
            html += `<div class="stat-item">
                <span class="stat-label">${field}:</span>
                <span class="stat-value">${count} 種類</span>
            </div>`;
        });
        
        html += '<h4>データ完全性</h4>';
        Object.entries(this.stats.completeness).forEach(([field, percentage]) => {
            html += `<div class="stat-item">
                <span class="stat-label">${field}:</span>
                <span class="stat-value">${percentage}%</span>
            </div>`;
        });
        
        container.innerHTML = html;
    }

    displayKeywords() {
        const container = document.getElementById('keywordResult');
        
        if (!this.keywordAnalysis || this.keywordAnalysis.grandTotal === 0) {
            container.innerHTML = '<p class="no-data">P1、KOP1、JOPのキーワードが見つかりませんでした</p>';
            return;
        }
        
        let html = '<div class="keyword-summary">';
        html += `<h4>キーワード詳細集計 (総合計: ${this.keywordAnalysis.grandTotal}個)</h4>`;
        
        // 詳細集計表を作成
        html += '<div class="detailed-count-table">';
        html += '<table class="count-table">';
        html += '<thead><tr><th>キーワード</th><th>A台</th><th>B台</th><th>その他</th><th>合計</th></tr></thead>';
        html += '<tbody>';
        
        this.keywordAnalysis.keywords.forEach(keyword => {
            const counts = this.keywordAnalysis.detailedCounts[keyword];
            if (counts.total > 0) {
                html += `<tr>
                    <td class="keyword-name">${keyword}定期</td>
                    <td class="count-cell">${counts['A台']}台</td>
                    <td class="count-cell">${counts['B台']}台</td>
                    <td class="count-cell">${counts['その他']}台</td>
                    <td class="total-cell">${counts.total}台</td>
                </tr>`;
            }
        });
        
        html += '</tbody></table>';
        html += '</div>';
        html += '</div>';
        
        if (this.keywordAnalysis.extractedData.length > 0) {
            html += '<div class="keyword-extracted">';
            html += '<h4>検出されたデータ詳細</h4>';
            html += '<div class="extracted-table">';
            html += '<table class="keyword-table">';
            html += '<thead><tr><th>行番号</th><th>キーワード</th><th>区分</th><th>データ内容</th></tr></thead>';
            html += '<tbody>';
            
            this.keywordAnalysis.extractedData.forEach(item => {
                const dataPreview = Object.values(item.originalData).join(' | ').substring(0, 80);
                item.foundMatches.forEach(match => {
                    html += `<tr>
                        <td>${item.rowIndex}</td>
                        <td><span class="found-keywords">${match.keyword}定期</span></td>
                        <td><span class="category-badge ${match.category}">${match.category}</span></td>
                        <td class="data-preview">${dataPreview}${dataPreview.length >= 80 ? '...' : ''}</td>
                    </tr>`;
                });
            });
            
            html += '</tbody></table>';
            html += '</div></div>';
        }
        
        container.innerHTML = html;
    }

    updateOrganizedDisplay() {
        const format = document.getElementById('outputFormat').value;
        const container = document.getElementById('organizedResult');
        
        switch (format) {
            case 'table':
                container.innerHTML = this.generateTableOutput();
                break;
            case 'json':
                container.innerHTML = `<pre><code>${JSON.stringify(this.processedData, null, 2)}</code></pre>`;
                break;
            case 'csv':
                container.innerHTML = `<pre><code>${this.generateCSVOutput()}</code></pre>`;
                break;
            case 'code':
                container.innerHTML = `<pre><code>${this.generateCodeOutput()}</code></pre>`;
                break;
        }
    }

    generateTableOutput() {
        if (!this.rawData || this.rawData.length === 0) return '<p>データがありません</p>';
        
        const keys = Object.keys(this.rawData[0]);
        let html = '<table class="data-table"><thead><tr>';
        
        keys.forEach(key => {
            const genre = this.genres[key] ? this.genres[key].join(', ') : '';
            html += `<th>
                <div class="header-cell">
                    <span class="field-name">${key}</span>
                    <span class="field-genre">${genre}</span>
                </div>
            </th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        this.rawData.forEach(row => {
            html += '<tr>';
            keys.forEach(key => {
                html += `<td>${row[key] || ''}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    }

    generateCSVOutput() {
        if (!this.rawData || this.rawData.length === 0) return '';
        
        const keys = Object.keys(this.rawData[0]);
        let csv = keys.join(',') + '\n';
        
        this.rawData.forEach(row => {
            const values = keys.map(key => {
                const value = row[key] || '';
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            });
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }

    generateCodeOutput() {
        let code = '// 定数定義\n';
        
        Object.entries(this.constants).forEach(([field, values]) => {
            const constantName = field.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
            code += `const ${constantName} = {\n`;
            values.forEach(([value, count]) => {
                const key = value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
                code += `  ${key}: '${value}', // ${count}回使用\n`;
            });
            code += '};\n\n';
        });
        
        code += '// ジャンル定義\n';
        code += `const FIELD_GENRES = ${JSON.stringify(this.genres, null, 2)};\n\n`;
        
        code += '// データ型定義\n';
        code += `const FIELD_TYPES = ${JSON.stringify(this.dataTypes, null, 2)};\n\n`;
        
        code += '// データ\n';
        code += `const DATA = ${JSON.stringify(this.rawData, null, 2)};`;
        
        return code;
    }

    copyToClipboard() {
        const format = document.getElementById('outputFormat').value;
        let textToCopy = '';
        
        switch (format) {
            case 'json':
                textToCopy = JSON.stringify(this.processedData, null, 2);
                break;
            case 'csv':
                textToCopy = this.generateCSVOutput();
                break;
            case 'code':
                textToCopy = this.generateCodeOutput();
                break;
            case 'table':
                textToCopy = this.generateCSVOutput();
                break;
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('クリップボードにコピーしました！');
        }).catch(err => {
            console.error('コピーに失敗しました:', err);
            alert('コピーに失敗しました');
        });
    }

    downloadData() {
        const format = document.getElementById('outputFormat').value;
        let content = '';
        let filename = '';
        let mimeType = '';
        
        switch (format) {
            case 'json':
                content = JSON.stringify(this.processedData, null, 2);
                filename = 'organized_data.json';
                mimeType = 'application/json';
                break;
            case 'csv':
                content = this.generateCSVOutput();
                filename = 'organized_data.csv';
                mimeType = 'text/csv';
                break;
            case 'code':
                content = this.generateCodeOutput();
                filename = 'organized_data.js';
                mimeType = 'text/javascript';
                break;
            case 'table':
                content = this.generateCSVOutput();
                filename = 'organized_data.csv';
                mimeType = 'text/csv';
                break;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DataOrganizer();
});