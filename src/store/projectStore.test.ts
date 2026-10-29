import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';

describe('Project Store Workbench Integration', () => {
  beforeEach(() => {
    useProjectStore.getState().forceNewProject();
  });

  it('places supported components on the workbench with unique labels and independent defaults', () => {
    const store = useProjectStore.getState();

    const uno = store.addComponent('arduino-uno');
    expect(uno).not.toBeNull();
    expect(uno?.label).toBe('U1');

    const r1 = store.addComponent('resistor');
    expect(r1).not.toBeNull();
    expect(r1?.label).toBe('R1');
    expect(r1?.properties.resistance).toBe(220);

    const r2 = store.addComponent('resistor');
    expect(r2).not.toBeNull();
    expect(r2?.label).toBe('R2');

    // Mutate r1 properties; ensure r2 remains independent
    const updateRes = store.updateComponentProperties(r1!.id, { resistance: 10000, unit: 'ohm' });
    expect(updateRes.success).toBe(true);

    const updatedState = useProjectStore.getState();
    const currentR1 = updatedState.project.circuit.components.find(c => c.id === r1!.id);
    const currentR2 = updatedState.project.circuit.components.find(c => c.id === r2!.id);

    expect(currentR1?.properties.resistance).toBe(10000);
    expect(currentR2?.properties.resistance).toBe(220); // r2 untouched!
  });

  it('rejects invalid property updates and does not commit invalid data', () => {
    const store = useProjectStore.getState();
    const r = store.addComponent('resistor');
    expect(r).not.toBeNull();

    // Negative resistance
    const negRes = store.updateComponentProperties(r!.id, { resistance: -500, unit: 'ohm' });
    expect(negRes.success).toBe(false);

    // Ensure resistance was not updated to negative
    const currentR = useProjectStore.getState().project.circuit.components.find(c => c.id === r!.id);
    expect(currentR?.properties.resistance).toBe(220);
  });

  it('deletes component and deselects it safely', () => {
    const store = useProjectStore.getState();
    const led = store.addComponent('led');
    expect(led).not.toBeNull();
    expect(useProjectStore.getState().selectedComponentId).toBe(led!.id);

    store.deleteComponent(led!.id);
    const stateAfterDelete = useProjectStore.getState();
    expect(stateAfterDelete.project.circuit.components.some(c => c.id === led!.id)).toBe(false);
    expect(stateAfterDelete.selectedComponentId).toBeNull();
  });

  it('rejects duplicate component labels', () => {
    const store = useProjectStore.getState();
    const r1 = store.addComponent('resistor');
    const r2 = store.addComponent('resistor');

    // Attempt to rename r2 to 'R1'
    const renameRes = store.updateComponentProperties(r2!.id, r2!.properties, 'R1');
    expect(renameRes.success).toBe(false);
    expect(renameRes.error).toMatch(/already used/i);
  });
});
