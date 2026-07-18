import { redirect } from 'next/navigation';

export default function LichKhamRedirectPage() {
    redirect('/admin/sokhambenh?tab=schedule');
}
