import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { PiggyBank, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useTaxExemptions } from '@/lib/api/hooks';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function TaxUsageWidget() {
    const { t } = useTranslation();
    const { user, userId } = useUser();
    const year = new Date().getFullYear();

    const { taxExemptions, loading } = useTaxExemptions({
        userId: userId!,
        year
    });

    const totalExemptions = useMemo(() => {
        return taxExemptions.reduce((sum, te) => sum + parseFloat(te.amount), 0);
    }, [taxExemptions]);

    const limit = user?.tax_allowance_limit || 1000;
    const usagePercent = Math.min((totalExemptions / limit) * 100, 100);
    const isOverLimit = totalExemptions > limit;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('taxes.taxAllowance')} ({year})</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-8 w-full animate-pulse bg-muted rounded mt-1" />
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalExemptions)}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                                {t('taxes.usedAmount')}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Progress value={usagePercent} className={isOverLimit ? "[&>div]:bg-destructive h-2" : "h-2"} />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{usagePercent.toFixed(0)}%</span>
                                <span>{formatCurrency(limit)}</span>
                            </div>
                        </div>

                        {isOverLimit && (
                            <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{t('taxes.totalLimit')} überschritten!</span>
                            </div>
                        )}

                        <Link
                            to="/taxes"
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline group"
                        >
                            {t('common.actions')} {t('taxes.editExemption')}
                            <ArrowRight className="h-2 w-2 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
