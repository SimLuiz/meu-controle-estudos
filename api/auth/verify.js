import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-secreto-123';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { rows } = await sql`
      SELECT id, name, email FROM users WHERE id = ${decoded.userId}
    `;

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    return res.status(200).json({ user: rows[0] });

  } catch (err) {
    console.error('Erro ao verificar token:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
}