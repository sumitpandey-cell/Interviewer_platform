
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nqbhyvnzpuezyqargqbn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYmh5dm56cHVlenlxYXJncWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODQ5MDEsImV4cCI6MjA3OTQ2MDkwMX0.kd2qsxEMJZXnfAxAptQNV8U8u2ceyWUru8sO1moyPXo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
    console.log("Checking database...");

    // Check Domains
    const { data: domains, error: domainsError } = await supabase.from('domains').select('*').limit(1);
    if (domainsError) {
        console.error("Error fetching domains:", domainsError.message);
    } else {
        console.log("Domains table exists. Count:", domains.length);
    }

    // Check Topics
    const { data: topics, error: topicsError } = await supabase.from('topics').select('*').limit(1);
    if (topicsError) {
        console.error("Error fetching topics:", topicsError.message);
    } else {
        console.log("Topics table exists. Count:", topics.length);
    }

    // Check Questions
    const { data: questions, error: questionsError } = await supabase.from('questions').select('*').limit(1);
    if (questionsError) {
        console.error("Error fetching questions:", questionsError.message);
    } else {
        console.log("Questions table exists. Count:", questions.length);
        if (questions.length > 0) {
            console.log("Sample question:", questions[0].title);
            console.log("Has test_cases:", !!questions[0].test_cases);
        }
    }
}

check();
