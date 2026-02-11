import React from 'react';
import { render } from '@testing-library/react';
import Canvas from '../../../components/Canvas';
import type { HyperGraph } from '../../core/schema';
import { describe, it, expect } from 'vitest';

describe('Canvas', () => {
  it('renders with empty graph', () => {
    const initial: HyperGraph = { id: 'empty', nodes: [], edges: [] };
    const { container } = render(<Canvas initial={initial} />);
    expect(container).toMatchSnapshot();
  });
});
