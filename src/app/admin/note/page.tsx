import { redirect } from 'next/navigation';

type NotePageProps = {
    searchParams?: {
        week?: string;
    };
};

export default function NoteRedirectPage({ searchParams }: NotePageProps) {
    const week = searchParams?.week;
    const params = new URLSearchParams({
        tab: 'schedule',
        section: 'handbook'
    });

    if (week) {
        params.set('week', week);
    }

    redirect(`/admin/sokhambenh?${params.toString()}`);
}
