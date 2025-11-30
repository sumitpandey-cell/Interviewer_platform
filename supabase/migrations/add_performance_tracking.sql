-- Migration: Add Performance Tracking Tables
-- Description: Adds tables and columns for dynamic difficulty adjustment and performance tracking

-- Create performance_metrics table to track individual question performance
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
  response_time_seconds INTEGER,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  hints_used INTEGER DEFAULT 0,
  struggle_indicators JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_performance_session ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_created ON performance_metrics(created_at);

-- Add performance tracking columns to interview_sessions table
DO $$ 
BEGIN
  -- Add difficulty_progression column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interview_sessions' AND column_name = 'difficulty_progression'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN difficulty_progression JSONB DEFAULT '[]';
  END IF;

  -- Add total_hints_used column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interview_sessions' AND column_name = 'total_hints_used'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN total_hints_used INTEGER DEFAULT 0;
  END IF;

  -- Add average_performance_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interview_sessions' AND column_name = 'average_performance_score'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN average_performance_score INTEGER;
  END IF;
END $$;

-- Add performance tracking columns to company_questions table
DO $$ 
BEGIN
  -- Add difficulty_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_questions' AND column_name = 'difficulty_score'
  ) THEN
    ALTER TABLE company_questions ADD COLUMN difficulty_score INTEGER CHECK (difficulty_score >= 1 AND difficulty_score <= 100);
  END IF;

  -- Add hints column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_questions' AND column_name = 'hints'
  ) THEN
    ALTER TABLE company_questions ADD COLUMN hints JSONB DEFAULT '[]';
  END IF;
END $$;

-- Create index on difficulty_score for efficient filtering
CREATE INDEX IF NOT EXISTS idx_company_questions_difficulty ON company_questions(difficulty_score);

-- Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Tracks candidate performance metrics for each question during interviews';
COMMENT ON COLUMN performance_metrics.response_quality_score IS 'AI-evaluated quality score from 0-100';
COMMENT ON COLUMN performance_metrics.struggle_indicators IS 'JSON object tracking struggle signals: {longPauses, clarificationRequests, incompleteAnswers, uncertaintyPhrases}';
COMMENT ON COLUMN interview_sessions.difficulty_progression IS 'Array tracking difficulty level changes throughout the interview';
COMMENT ON COLUMN interview_sessions.total_hints_used IS 'Total number of hints provided during the interview';
COMMENT ON COLUMN interview_sessions.average_performance_score IS 'Average performance score across all questions';
COMMENT ON COLUMN company_questions.difficulty_score IS 'Numeric difficulty rating from 1-100';
COMMENT ON COLUMN company_questions.hints IS 'Array of predefined hints for this question';
