import { SCORECARD_FILENAME, SCORECARD_HREF } from '../lib/lead-magnet';

/** Download the scorecard when a demo-kit button is clicked. One listener per button. */
export function initScorecardDownload(): void {
  document.querySelectorAll<HTMLElement>('[data-download-scorecard]').forEach((btn) => {
    if (btn.dataset.scorecardBound === 'true') return;
    btn.dataset.scorecardBound = 'true';
    btn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = SCORECARD_HREF;
      link.download = SCORECARD_FILENAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
}
