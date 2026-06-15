export interface Property {
  name: string;
  dataType: string;
  semanticType: string;
  confidence: number; // e.g. 0.95
  owner: string;
  status: 'Published' | 'Draft' | 'Deprecated';
  description: string;
}

export type ObjectGroup = '核心数据对象' | '语义治理对象' | '质量治理对象' | '运行治理对象';

export interface ObjectType {
  id: string; // e.g. "Field"
  nameCn: string; // e.g. "字段对象"
  description: string;
  group: ObjectGroup;
  instanceCount: number;
  properties: Property[];
  lifecycle: string[];
  status: 'Published' | 'Draft' | 'Deprecated' | 'Modified';
  owner: string;
}

export interface LinkType {
  id: string; // e.g. "has_assertion"
  nameCn: string;
  sourceObjId: string;
  targetObjId: string;
  direction: string; // e.g. "Field → SemanticAssertion"
  cardinality: '1:1' | '1:N' | 'N:M';
  isLineage: boolean;
  isAiVisible: boolean;
  requiresAuth: boolean;
  description: string;
}

export interface Capability {
  id: string;
  name: string;
  type: 'function' | 'action';
  inputObject: string;
  outputObjectOrStatus: string;
  isAiEnabled: '是' | '否' | '可建议';
  workflows: string[];
  permissions: string;
  description: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  type: 'Trigger' | 'Function' | 'Action' | 'Condition' | 'HumanReview' | 'Audit';
  description: string;
}

export interface DRKNWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Draft' | 'Deprecated';
  nodes: WorkflowNode[];
  runCount: number;
  successRate: number; // e.g. 98.6
}

export interface ChangeSet {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'editing' | 'pending_review' | 'approved' | 'published';
  changes: {
    type: 'add_object' | 'modify_property' | 'add_link' | 'modify_workflow' | 'bind_capability';
    target: string;
    description: string;
  }[];
}

export interface ValidationItem {
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
}
