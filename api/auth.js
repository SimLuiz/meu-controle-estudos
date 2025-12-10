import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process?.env?.JWT_SECRET || 'seu-secret-super-secreto-123';

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDB();

    // REGISTRO
    if (req.method === 'POST' && req.url.includes('/register')) {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }

      // Verificar se email já existe
      const { rows: existing } = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const { rows } = await sql`
        INSERT INTO users (name, email, password)
        VALUES (${name}, ${email}, ${hashedPassword})
        RETURNING id, name, email
      `;

      const user = rows[0];

      // Gerar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    }

    // LOGIN
    if (req.method === 'POST' && req.url.includes('/login')) {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      const { rows } = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const user = rows[0];

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Gerar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    }

    // VERIFICAR TOKEN
    if (req.method === 'GET' && req.url.includes('/verify')) {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { rows } = await sql`
          SELECT id, name, email FROM users WHERE id = ${decoded.userId}
        `;

        if (rows.length === 0) {
          return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        return res.status(200).json({ user: rows[0] });
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: err.message });
  }
}