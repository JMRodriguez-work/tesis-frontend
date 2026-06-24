import { createFileRoute, redirect } from '@tanstack/react-router';
import { fetchMe } from '@/api/queries/use-auth';
import { LandingPage } from '@/components/landing/landing-page';

const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const me = await fetchMe();
    if (me) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LandingPage,
});

export { Route };
