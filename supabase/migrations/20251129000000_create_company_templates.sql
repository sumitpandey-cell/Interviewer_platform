-- Create company_templates table for storing company information
CREATE TABLE public.company_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  industry TEXT,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  common_roles TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_templates
ALTER TABLE public.company_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can view company templates)
CREATE POLICY "Anyone can view active company templates"
  ON public.company_templates FOR SELECT
  USING (is_active = true);

-- Create policy for authenticated users to view all templates
CREATE POLICY "Authenticated users can view all company templates"
  ON public.company_templates FOR SELECT
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_company_templates_slug ON public.company_templates(slug);
CREATE INDEX idx_company_templates_industry ON public.company_templates(industry);
CREATE INDEX idx_company_templates_active ON public.company_templates(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_company_templates_updated_at
  BEFORE UPDATE ON public.company_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.company_templates IS 'Stores company information for company-specific interview templates';
