import { Link } from 'react-router-dom';
import { articleDate } from '../api/articles.js';
export function ArticleAccessPanel({ access }) {
  if (!access) return null;
  if (!access.subscriptionsEnabled)
    return (
      <section className="mb-8 rounded-xl border border-border/70 bg-secondary/20 p-5">
        <h2 className="font-semibold">Your article space</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Publishing is free during early access. Share your stories with the community.
        </p>
      </section>
    );
  return (
    <div className="rounded-2xl mx-auto mb-6 mt-6 max-w-[76rem] border border-border bg-secondary/20 p-5">
      <h2 className="font-semibold">Article space</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {access.remaining} of {access.monthlyLimit} new articles available this month. Resets{' '}
        {articleDate(access.resetsAt)} (UTC). Drafts are free; archiving does not restore a space.
      </p>
      <Link
        to="/profile/subscriptions?feature=author.publish_article&returnTo=%2Fprofile%2Farticles"
        className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline"
      >
        {access.hasSubscription ? 'Manage article subscription' : 'Subscribe to publish articles'}
      </Link>
    </div>
  );
}
