import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'You must be signed in to access this endpoint' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getDocumentTypes(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all document types
async function getDocumentTypes(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching document types:', error);
      return res.status(500).json({ error: 'Failed to fetch document types' });
    }

    return res.status(200).json({ documentTypes: data });
  } catch (error: any) {
    console.error('Error in getDocumentTypes:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
