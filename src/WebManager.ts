import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import statusCodes from "http-status-codes";

import {
  Assignment,
  BaseManager,
  BaseManagerOptions,
  IItem,
  ItemType,
  Permission,
  RBACResponse,
  Role,
  Rule,
} from "@iushev/rbac";

export type WebManagerOptions = BaseManagerOptions & {
  path: string;
  authorization: () => string;
};

export default class WebManager extends BaseManager {
  private readonly axiosInstance: AxiosInstance;

  protected assignments: Map<string, Map<string, Assignment>> = new Map();

  constructor(options: WebManagerOptions) {
    const { path, authorization, ...restOptions } = options;
    super(restOptions);

    this.axiosInstance = axios.create({
      baseURL: path,
    });

    this.axiosInstance.interceptors.request.use((config) => {
      if (authorization) {
        const token = authorization();
        config.headers.Authorization = "Bearer " + token;
      } else {
        config.headers.Authorization = undefined;
      }
      return config;
    });
  }

  async load(config?: AxiosRequestConfig): Promise<void> {
    let _rbac: RBACResponse;
    try {
      const response = await this.axiosInstance.get<RBACResponse>("/rbac", config);
      _rbac = response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === statusCodes.NOT_FOUND) {
        _rbac = {
          assignments: {},
          items: {},
          rules: {},
        };
      } else {
        throw err;
      }
    }

    this.items = this.getRbacItems(_rbac);
    this.parents = this.getRbacParents(_rbac);
    this.rules = this.getRbacRules(_rbac);
    this.assignments = this.getRbacAssignments(_rbac);
  }

  private getRbacItems({ items }: RBACResponse) {
    return Object.keys(items).reduce<Map<string, IItem>>((prevValue, name) => {
      const item = items[name];
      const ItemClass = item.type === ItemType.permission ? Permission : Role;
      prevValue.set(
        name,
        new ItemClass({
          name,
          description: item.description ?? null,
          ruleName: item.ruleName ?? null,
        }),
      );
      return prevValue;
    }, new Map());
  }

  private getRbacParents({ items }: RBACResponse) {
    return Object.keys(items).reduce<Map<string, Map<string, IItem>>>((prevValue, name) => {
      const item = items[name];
      if (!item.children || item.children.length === 0) {
        return prevValue;
      }
      item.children.forEach((childName: string) => {
        if (!this.items.has(childName)) {
          return;
        }

        let child = prevValue.get(childName);

        if (!child) {
          child = new Map();
          prevValue.set(childName, child);
        }

        const item = this.items.get(name);
        if (item) {
          child.set(name, item);
        }
      });

      return prevValue;
    }, new Map());
  }

  private getRbacRules({ rules }: RBACResponse) {
    return Object.keys(rules).reduce<Map<string, Rule>>((prevValue, name) => {
      const ruleData = rules[name];
      const RuleClass = this.ruleClasses.get(ruleData.data.typeName) ?? Rule;
      const rule = new RuleClass(name, JSON.parse(ruleData.data.ruleData));
      prevValue.set(name, rule);
      return prevValue;
    }, new Map());
  }

  private getRbacAssignments({ assignments }: RBACResponse) {
    return Object.keys(assignments).reduce<Map<string, Map<string, Assignment>>>((prevValue, username) => {
      const _assignments = assignments[username];
      _assignments.forEach((itemName) => {
        if (prevValue.has(username)) {
          prevValue.get(username)?.set(itemName, new Assignment(username, itemName));
        } else {
          prevValue.set(username, new Map([[itemName, new Assignment(username, itemName)]]));
        }
      });
      return prevValue;
    }, new Map());
  }

  getRolesByUser(_username: string): Promise<Map<string, Role>> {
    throw new Error("Method not implemented.");
  }
  getChildRoles(_roleName: string): Promise<Map<string, Role>> {
    throw new Error("Method not implemented.");
  }
  getPermissionsByRole(_roleName: string): Promise<Map<string, Permission>> {
    throw new Error("Method not implemented.");
  }
  getPermissionsByUser(_username: string): Promise<Map<string, Permission>> {
    throw new Error("Method not implemented.");
  }
  getRule(_name: string): Promise<Rule | null> {
    throw new Error("Method not implemented.");
  }
  getRules(): Promise<Map<string, Rule>> {
    throw new Error("Method not implemented.");
  }
  canAddChild(_parent: IItem, _child: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  addChild(_parent: IItem, _child: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  removeChild(_parent: IItem, _child: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  removeChildren(_parent: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  hasChild(_parent: IItem, _child: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getChildren(_name: string): Promise<Map<string, IItem>> {
    throw new Error("Method not implemented.");
  }
  assign(_role: Role | Permission, _username: string): Promise<Assignment> {
    throw new Error("Method not implemented.");
  }
  revoke(_role: Role | Permission, _username: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  revokeAll(_username: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async getAssignment(roleName: string, username: string): Promise<Assignment | null> {
    return this.assignments.get(username)?.get(roleName) ?? null;
  }
  async getAssignments(username: string): Promise<Map<string, Assignment>> {
    return this.assignments.get(username) ?? new Map();
  }
  getUsernamesByRole(_roleName: string): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  removeAll(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeAllPermissions(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeAllRoles(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeAllRules(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeAllAssignments(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getItem(_name: string): Promise<IItem | null> {
    throw new Error("Method not implemented.");
  }
  getItems(_type: ItemType): Promise<Map<string, IItem>> {
    throw new Error("Method not implemented.");
  }
  addItem(_item: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  addRule(_rule: Rule): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  removeItem(_item: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  removeRule(_rule: Rule): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  updateItem(_name: string, _item: IItem): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  updateRule(_name: string, _rule: Rule): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
