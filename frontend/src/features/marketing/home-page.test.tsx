import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const styles = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');
const documentHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('HomePage', () => {
  it('links Login to the configured main application and opens the trial flow', () => {
    const onStartTrial = vi.fn();
    render(<HomePage mainAppUrl="https://owner.example.com" onStartTrial={onStartTrial} />);

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', 'https://owner.example.com');
    expect(screen.getByAltText('PoultryHisab logo')).toHaveAttribute('src', expect.stringContaining('poultryhisab-logo'));
    expect(screen.getByAltText('PoultryHisab logo')).toHaveClass('brand__mark');

    fireEvent.click(screen.getAllByRole('button', { name: /start free trial/i })[0]);
    expect(onStartTrial).toHaveBeenCalledOnce();
  });

  it('declares favicon, search, and social metadata', () => {
    expect(documentHtml).toContain('rel="icon"');
    expect(documentHtml).toContain('name="robots"');
    expect(documentHtml).toContain('property="og:title"');
    expect(documentHtml).toContain('property="og:description"');
    expect(documentHtml).toContain('name="twitter:card"');
  });

  it('keeps the landing page within a 375px viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    render(<HomePage mainAppUrl="https://owner.example.com" onStartTrial={vi.fn()} />);

    expect(document.querySelector('main')).toBeInTheDocument();
    expect(styles).toContain('overflow-x: clip');
    expect(styles).toContain('@media (max-width: 760px)');
  });

  it('uses a white circular badge for the brand logo', () => {
    expect(styles).toContain('.brand__mark');
    expect(styles).toContain('background: #fff');
    expect(styles).toContain('border-radius: 50%');
  });
});
