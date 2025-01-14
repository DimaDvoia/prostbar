const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Определяем uploadDir в начале файла
const uploadDir = path.join(__dirname, 'public/uploads');

// Создаем папку, если её нет
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());

// Настраиваем статические файлы
app.use(express.static('public'));
app.use('/uploads', express.static(uploadDir));

// Конфигурация подключения к базе данных
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'prostbar',
    password: 'admin',
    port: 5432,
});

// Тестовое подключение к БД
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err);
    } else {
        console.log('Успешное подключение к БД');
    }
});

// Настраиваем хранение файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Получение всех коктейлей
app.get('/api/cocktails', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.*, 
                cc.name as category_name, 
                cc.description as category_description 
            FROM cocktails c 
            JOIN cocktail_categories cc ON c.category_id = cc.id 
            ORDER BY cc.id, c.name
        `;
        const result = await pool.query(query);
        console.log('Данные из БД:', result.rows);
        
        // Группируем коктейли по категориям
        const cocktails = {};
        result.rows.forEach(row => {
            if (!cocktails[row.category_id]) {
                cocktails[row.category_id] = {
                    name: row.category_name,
                    description: row.category_description,
                    items: []
                };
            }
            cocktails[row.category_id].items.push({
                id: row.id,
                name: row.name,
                ingredients: row.ingredients,
                image_url: row.image_url,
                category_id: row.category_id
            });
        });
        
        console.log('Отправляем на клиент:', cocktails);
        res.json(cocktails);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получение всех категорий
app.get('/api/categories', async (req, res) => {
    try {
        console.log('Запрос на получение категорий...');
        const result = await pool.query('SELECT * FROM cocktail_categories ORDER BY name');
        console.log('Найдено категорий:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении категорий:', err);
        res.status(500).json({ error: err.message });
    }
});

// Обновляем endpoint добавления коктейля
app.post('/api/cocktails', upload.single('image'), async (req, res) => {
    try {
        console.log('Получены данные:', req.body);
        console.log('Файл:', req.file);
        console.log('Путь к файлу:', path.join(__dirname, 'public/uploads', req.file.filename));
        console.log('URL изображения:', `/uploads/${req.file.filename}`);
        
        const { category_id, name, ingredients } = req.body;
        const image_url = `/uploads/${req.file.filename}`;
        
        // Проверяем наличие всех необходимых данных
        if (!name || !category_id || !ingredients) {
            return res.status(400).json({ 
                error: 'Не все поля заполнены',
                received: { category_id, name, ingredients }
            });
        }

        const result = await pool.query(
            'INSERT INTO cocktails (category_id, name, ingredients, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [category_id, name, ingredients, image_url]
        );
        
        console.log('Файл существует:', fs.existsSync(path.join(__dirname, 'public/uploads', req.file.filename)));
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: err.message });
    }
});

// Добавьте тестовый endpoint
app.get('/api/test', async (req, res) => {
    try {
        // Проверяем существование таблицы
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'cocktail_categories'
            );
        `);
        
        // Проверяем количество категорий
        const categoriesCount = await pool.query('SELECT COUNT(*) FROM cocktail_categories');
        
        res.json({
            tableExists: tableCheck.rows[0].exists,
            categoriesCount: categoriesCount.rows[0].count,
            message: 'Test endpoint working'
        });
    } catch (err) {
        console.error('Test endpoint error:', err);
        res.status(500).json({ 
            error: err.message,
            detail: err.stack 
        });
    }
});

app.get('/api/check-uploads', (req, res) => {
    const files = fs.readdirSync(uploadDir);
    res.json({
        uploadDir,
        exists: fs.existsSync(uploadDir),
        files,
        absolutePath: path.resolve(uploadDir)
    });
});

// Добавление новой категории
app.post('/api/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'INSERT INTO cocktail_categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получение конкретного коктейля
app.get('/api/cocktails/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cocktails WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Коктейль не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обновление коктейля
app.put('/api/cocktails/:id', upload.single('image'), async (req, res) => {
    try {
        const { category_id, name, ingredients } = req.body;
        let image_url = undefined;
        
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        const updateFields = ['category_id', 'name', 'ingredients'];
        const values = [category_id, name, ingredients];
        
        if (image_url) {
            updateFields.push('image_url');
            values.push(image_url);
        }
        
        const query = `
            UPDATE cocktails 
            SET ${updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ')}
            WHERE id = $${updateFields.length + 1}
            RETURNING *
        `;
        
        values.push(req.params.id);
        
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Удаление коктейля
app.delete('/api/cocktails/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cocktails WHERE id = $1', [req.params.id]);
        res.json({ message: 'Коктейль успешно удален' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 