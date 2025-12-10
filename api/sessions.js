import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process?.env?.JWT_SECRET || 'seu-secret-super-secreto-123';

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255) NOT NULL,
      duration DECIMAL(5,2) NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token não fornecido');
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (err) {
    throw new Error('Token inválido');
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDB();

    // Verificar autenticação
    const userId = verifyToken(req);

    // GET - Listar sessões do usuário
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM study_sessions 
        WHERE user_id = ${userId}
        ORDER BY date DESC, created_at DESC
      `;
      return res.status(200).json(rows);
    }

    // POST - Criar nova sessão
    if (req.method === 'POST') {
      const { subject, duration, date, notes } = req.body;

      const { rows } = await sql`
        INSERT INTO study_sessions (user_id, subject, duration, date, notes)
        VALUES (${userId}, ${subject}, ${duration}, ${date}, ${notes || ''})
        RETURNING *
      `;

      return res.status(201).json(rows[0]);
    }

    // DELETE - Deletar sessão (apenas do próprio usuário)
    if (req.method === 'DELETE') {
      const { id } = req.query;

      const { rows } = await sql`
        DELETE FROM study_sessions 
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Sessão não encontrada' });
      }

      return res.status(200).json({ message: 'Sessão deletada' });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err) {
    console.error('Erro na API:', err);
    
    if (err.message === 'Token não fornecido' || err.message === 'Token inválido') {
      return res.status(401).json({ error: err.message });
    }
    
    return res.status(500).json({ error: err.message });
  }
}