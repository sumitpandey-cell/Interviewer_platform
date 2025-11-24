import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";

export default function InterviewComplete() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate processing time (e.g., 3 seconds) before redirecting to report
        const timer = setTimeout(() => {
            navigate(`/interview/${sessionId}/report`);
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, sessionId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 font-sans p-4">
            <Card className="w-full max-w-lg p-12 text-center shadow-2xl border-none bg-white rounded-2xl">
                <h1 className="text-3xl font-bold text-purple-600 mb-6">Interview Complete</h1>
                <div className="space-y-3 text-slate-600 mb-10">
                    <p className="text-lg">Thank you for attending the interview.</p>
                    <p className="text-lg">You'll be redirected shortly.</p>
                    <p className="text-sm text-slate-400 mt-4">Please don't close the tab we're just finalizing everything.</p>
                </div>

                <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-full border-[5px] border-slate-100 border-t-blue-500 border-r-purple-500 animate-spin"></div>
                </div>
            </Card>
        </div>
    );
}
