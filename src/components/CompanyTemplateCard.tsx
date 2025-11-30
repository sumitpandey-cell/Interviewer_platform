import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyTemplate } from "@/types/company-types";
import { Building2, Loader2 } from "lucide-react";

interface CompanyTemplateCardProps {
    template: CompanyTemplate;
    onSelect: (template: CompanyTemplate) => void;
    isLoading?: boolean;
}

export function CompanyTemplateCard({ template, onSelect, isLoading }: CompanyTemplateCardProps) {
    const getDifficultyColor = (difficulty: string | null) => {
        switch (difficulty) {
            case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <CardContent className="p-8 flex flex-col h-full">
                {/* Company Logo and Name */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center border border-orange-200 dark:border-orange-700 overflow-hidden">
                        {template.logo_url ? (
                            <img
                                src={template.logo_url}
                                alt={`${template.name} logo`}
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <Building2 className={`h-8 w-8 text-orange-600 dark:text-orange-400 ${template.logo_url ? 'hidden' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {template.name}
                        </h3>
                        <div className="flex gap-2 items-center flex-wrap">
                            {template.industry && (
                                <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    {template.industry}
                                </Badge>
                            )}
                            {template.difficulty && (
                                <Badge className={`text-xs whitespace-nowrap ${getDifficultyColor(template.difficulty)}`}>
                                    {template.difficulty}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-sm mb-4 flex-1">
                    {template.description && (
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                            {template.description}
                        </p>
                    )}

                    {/* Common Roles */}
                    {template.common_roles && template.common_roles.length > 0 && (
                        <div className="mt-3">
                            <span className="text-gray-500 dark:text-gray-500 font-normal text-xs">Common Roles:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {template.common_roles.slice(0, 3).map((role, index) => (
                                    <span
                                        key={index}
                                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    >
                                        {role}
                                    </span>
                                ))}
                                {template.common_roles.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 text-gray-500 dark:text-gray-500">
                                        +{template.common_roles.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between gap-3 pt-2 mt-auto">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Real interview questions
                    </span>
                    <Button
                        className="w-auto px-8 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white rounded-xl py-3 font-medium transition-all hover:scale-[1.02]"
                        onClick={() => onSelect(template)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            "Select"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
