import { Card } from '@/components/ui/Card';

export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-slate-800 rounded-lg" />
                    <div className="h-4 w-96 bg-slate-800/50 rounded-lg" />
                </div>
                <div className="h-10 w-32 bg-slate-800 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 space-y-6">
                    <div className="h-6 w-32 bg-slate-800 rounded-lg mb-6" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 w-full bg-slate-800/50 rounded-xl" />
                    ))}
                </Card>

                <div className="space-y-6">
                    <Card className="space-y-6">
                        <div className="h-6 w-32 bg-slate-800 rounded-lg" />
                        <div className="space-y-4">
                            <div className="h-20 w-full bg-slate-800/30 rounded-lg" />
                            <div className="h-20 w-full bg-slate-800/30 rounded-lg" />
                        </div>
                    </Card>
                    <Card>
                        <div className="h-48 w-full bg-slate-800/30 rounded-lg" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
