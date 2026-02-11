import React from 'react';
import { render, screen } from '@testing-library/react';
import CompositeEditor from '../../../components/CompositeEditor';
import type { HyperGraph } from '../../core/schema';
import { describe, it, expect, vi } from 'vitest';

describe('CompositeEditor', () => {
  it('renders default editor state', () => {
    const onChange = vi.fn();
    const { container } = render(<CompositeEditor onChange={onChange} />);
    expect(container).toMatchSnapshot();
    expect(screen.getByLabelText('Composite Subgraph JSON')).not.toBeNull();
  });

  it('renders with provided value', () => {
    const onChange = vi.fn();
    const value: HyperGraph = { id: 'g1', nodes: [], edges: [] };
    const { container } = render(<CompositeEditor value={value} onChange={onChange} />);
    expect(container).toMatchSnapshot();
  });
});
