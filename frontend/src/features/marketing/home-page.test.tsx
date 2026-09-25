import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const styles = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');

describe('HomePage', () => {
  it('links Login to the configured main application and opens the trial flow', () => {
    const onStartTrial = vi.fn();
    render(<HomePage mainAppUrl="https://owner.example.com" onStartTrial={onStartTrial} />);

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', 'https://owner.example.com');

    fireEvent.click(screen.getAllByRole('button', { name: /start free trial/i })[0]);
    expect(onStartTrial).toHaveBeenCalledOnce();
  });

  it('keeps the landing page within a 375px viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    render(<HomePage mainAppUrl="https://owner.example.com" onStartTrial={vi.fn()} />);

    expect(document.querySelector('main')).toBeInTheDocument();
    expect(styles).toContain('overflow-x: clip');
    expect(styles).toContain('@media (max-width: 760px)');
  });
});
