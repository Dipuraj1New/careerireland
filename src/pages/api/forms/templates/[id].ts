import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/types/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'You must be signed in to access this endpoint' });
  }

  // Get template ID from the request
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getFormTemplate(req, res, id);
    case 'PUT':
      // Check if user is an admin for PUT
      if (session.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'You do not have permission to update templates' });
      }
      return updateFormTemplate(req, res, id, session.user.id);
    case 'DELETE':
      // Check if user is an admin for DELETE
      if (session.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'You do not have permission to delete templates' });
      }
      return deleteFormTemplate(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get a specific form template
async function getFormTemplate(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Template not found' });
      }
      console.error('Error fetching form template:', error);
      return res.status(500).json({ error: 'Failed to fetch form template' });
    }

    return res.status(200).json({ template: data });
  } catch (error: any) {
    console.error('Error in getFormTemplate:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Update a form template
async function updateFormTemplate(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  try {
    const template = req.body;

    // Validate required fields
    if (!template.name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    // Check if any section has fields
    const hasFields = template.sections && template.sections.some((section: any) => section.fields && section.fields.length > 0);
    if (!hasFields) {
      return res.status(400).json({ error: 'Template must have at least one field' });
    }

    // Add metadata
    const templateWithMetadata = {
      ...template,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    // Update in database
    const { data, error } = await supabase
      .from('form_templates')
      .update(templateWithMetadata)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating form template:', error);
      return res.status(500).json({ error: 'Failed to update form template' });
    }

    return res.status(200).json({ template: data });
  } catch (error: any) {
    console.error('Error in updateFormTemplate:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Delete a form template
async function deleteFormTemplate(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if template is in use before deleting
    const { data: usageData, error: usageError } = await supabase
      .from('forms')
      .select('id')
      .eq('template_id', id)
      .limit(1);

    if (usageError) {
      console.error('Error checking template usage:', usageError);
      return res.status(500).json({ error: 'Failed to check if template is in use' });
    }

    if (usageData && usageData.length > 0) {
      return res.status(400).json({ error: 'Cannot delete template that is in use by existing forms' });
    }

    // Delete from database
    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting form template:', error);
      return res.status(500).json({ error: 'Failed to delete form template' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in deleteFormTemplate:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
