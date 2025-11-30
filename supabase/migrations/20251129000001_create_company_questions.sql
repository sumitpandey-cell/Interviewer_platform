-- Create company_questions table for storing company-specific interview questions
CREATE TABLE public.company_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('Technical', 'Behavioral', 'System Design', 'Coding', 'Case Study')),
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  role TEXT,
  experience_level TEXT CHECK (experience_level IN ('Entry', 'Mid', 'Senior', 'Staff', 'Principal')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_questions
ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can view active questions)
CREATE POLICY "Anyone can view active company questions"
  ON public.company_questions FOR SELECT
  USING (is_active = true);

-- Create policy for authenticated users to view all questions
CREATE POLICY "Authenticated users can view all company questions"
  ON public.company_questions FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for faster lookups
CREATE INDEX idx_company_questions_company_id ON public.company_questions(company_id);
CREATE INDEX idx_company_questions_type ON public.company_questions(question_type);
CREATE INDEX idx_company_questions_difficulty ON public.company_questions(difficulty);
CREATE INDEX idx_company_questions_role ON public.company_questions(role);
CREATE INDEX idx_company_questions_active ON public.company_questions(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_company_questions_updated_at
  BEFORE UPDATE ON public.company_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.company_questions IS 'Stores interview questions asked at specific companies';

-- Create function to get random questions for a company
CREATE OR REPLACE FUNCTION public.get_random_company_questions(
  p_company_id UUID,
  p_count INTEGER DEFAULT 5,
  p_role TEXT DEFAULT NULL,
  p_question_type TEXT DEFAULT NULL
)
RETURNS SETOF public.company_questions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.company_questions
  WHERE 
    company_id = p_company_id
    AND is_active = true
    AND (p_role IS NULL OR role = p_role OR role IS NULL)
    AND (p_question_type IS NULL OR question_type = p_question_type)
  ORDER BY RANDOM()
  LIMIT p_count;
END;
$$;

-- Add comment for function
COMMENT ON FUNCTION public.get_random_company_questions IS 'Returns random interview questions for a specific company, optionally filtered by role and question type';
