# Company-Based Interview Template System - Setup Guide

## Overview
This guide will help you complete the setup of the company-based interview template system.

## Step 1: Run Database Migrations

The database migrations have been created but need to be applied. Run them in order:

```bash
# If using Supabase CLI (local development)
supabase db reset  # This will run all migrations

# OR apply migrations individually via Supabase Dashboard
# Navigate to: Supabase Dashboard > SQL Editor
# Then run each migration file in order:
# 1. 20251129000000_create_company_templates.sql
# 2. 20251129000001_create_company_questions.sql
# 3. 20251129000002_seed_company_data.sql
```

### Manual Migration (if needed)

If you need to run migrations manually:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file (in order)
4. Execute each one

## Step 2: Update Supabase Types

After running migrations, regenerate TypeScript types:

```bash
# If using Supabase CLI
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# OR for remote database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

This will resolve all TypeScript errors related to `company_templates` and `company_questions` tables.

## Step 3: Remaining Implementation

### Files Already Created ✅
- ✅ Database migrations (3 files)
- ✅ TypeScript types (`src/types/company-types.ts`)
- ✅ Company questions hook (`src/hooks/use-company-questions.ts`)
- ✅ Updated optimized queries hook
- ✅ Company template card component
- ✅ Updated Templates page with tabs

### Files That Need Updates ⚠️

#### 1. StartInterview Form
**File**: `src/pages/StartInterview.tsx`

Add the following features:
- Radio group to select "General" vs "Company-Specific" interview
- Company dropdown (populated from state passed via navigation)
- Role input field for company interviews
- Experience level selector
- Update form submission to include company data in config

#### 2. Interview Store
**File**: `src/stores/use-interview-store.ts`

Add company-related state:
```typescript
companyTemplateId: string | null;
companyQuestions: CompanyQuestion[];
setCompanyData: (templateId: string, questions: CompanyQuestion[]) => void;
```

#### 3. Interview Room AI Integration
**File**: `src/pages/InterviewRoom.tsx`

Update `generateSystemInstruction` function to:
- Check if session has company template ID in config
- Fetch company questions using the hook
- Inject questions into system instruction
- Instruct Auro to ask these specific questions

## Step 4: Testing

### Test General Templates
1. Navigate to `/templates`
2. Click "General Templates" tab
3. Select any template
4. Complete interview setup
5. Verify interview starts normally

### Test Company Templates
1. Navigate to `/templates`
2. Click "Company Templates" tab
3. You should see 8 companies (Google, Amazon, Microsoft, Meta, Apple, Netflix, Tesla, Stripe)
4. Click "Use Template" on any company
5. Fill out the company-specific interview form
6. Start interview
7. Verify Auro asks company-specific questions

## Step 5: Verification Checklist

- [ ] Database migrations applied successfully
- [ ] TypeScript types regenerated (no TS errors)
- [ ] Templates page shows both tabs
- [ ] Company templates load and display
- [ ] General interview flow works (no regression)
- [ ] Company interview form shows correct fields
- [ ] Company questions are fetched and used by AI
- [ ] Interview sessions save company data in config

## Troubleshooting

### TypeScript Errors
- **Issue**: `company_templates` table not found
- **Solution**: Run migrations and regenerate types

### No Company Templates Showing
- **Issue**: Empty list in Company Templates tab
- **Solution**: Check if seed migration ran successfully

### Company Questions Not Asked
- **Issue**: Auro doesn't ask company-specific questions
- **Solution**: Check InterviewRoom.tsx implementation and console logs

## Database Schema Reference

### company_templates
- `id`: UUID (primary key)
- `name`: Company name
- `slug`: URL-friendly identifier
- `logo_url`: Company logo
- `industry`: Industry category
- `description`: Company description
- `difficulty`: Beginner | Intermediate | Advanced
- `common_roles`: Array of common job roles
- `is_active`: Boolean flag

### company_questions
- `id`: UUID (primary key)
- `company_id`: Foreign key to company_templates
- `question_text`: The actual question
- `question_type`: Technical | Behavioral | System Design | Coding | Case Study
- `difficulty`: Easy | Medium | Hard
- `role`: Target role (optional)
- `experience_level`: Entry | Mid | Senior | Staff | Principal
- `tags`: Array of tags
- `is_active`: Boolean flag

## Next Steps

1. Run the database migrations
2. Regenerate TypeScript types
3. Complete the remaining file updates (StartInterview, InterviewStore, InterviewRoom)
4. Test the complete flow
5. Deploy to production

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify RLS policies are correct
4. Ensure all migrations ran successfully
