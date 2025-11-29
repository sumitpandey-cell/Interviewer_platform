
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Domain {
    id: string;
    name: string;
    icon: string;
    description: string;
    companies: string[];
}

export interface Topic {
    id: string;
    name: string;
    description: string;
    domain_id: string;
}

export interface Question {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    domain_id: string;
    topic_id?: string;
    topics: string[];
    description: string;
    constraints: string[];
    examples: { input: string; output: string; explanation?: string }[];
    test_cases: { input: string; output: string }[];
    hints: string[];
    default_code: Record<string, string>;
}

export function useCodingRound() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('domains')
                .select('*');
                console.log("nlldkngslglsn",data)

            if (error) throw error;
            setDomains(data || []);
        } catch (error) {
            console.error('Error fetching domains:', error);
            toast.error('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopics = async (domainId: string) => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('topics')
                .select('*')
                .eq('domain_id', domainId);

            if (error) throw error;
            setTopics(data || []);
        } catch (error) {
            console.error('Error fetching topics:', error);
            toast.error('Failed to load topics');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestions = async (domainId: string, topicId?: string, difficulty?: string) => {
        try {
            setLoading(true);
            let query = (supabase as any)
                .from('questions')
                .select('*')
                .eq('domain_id', domainId);

            if (topicId && topicId !== 'all') {
                query = query.eq('topic_id', topicId);
            }

            if (difficulty && difficulty !== 'Mixed') {
                query = query.eq('difficulty', difficulty);
            }

            const { data, error } = await query;

            if (error) throw error;

            const fetchedQuestions = data || [];
            console.log(`Fetched ${fetchedQuestions.length} questions`);
            if (fetchedQuestions.length === 0) {
                toast.warning('No questions found for the selected criteria');
            } else {
                // toast.success(`Loaded ${fetchedQuestions.length} questions`);
            }
            setQuestions(fetchedQuestions);
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    return {
        domains,
        topics,
        questions,
        loading,
        fetchTopics,
        fetchQuestions
    };
}
