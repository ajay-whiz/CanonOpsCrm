import { Client } from 'asana';
import { ASANA_ACCESS_TOKEN } from '../../lib/asanaClient';

const asanaClient = new Client({ accessToken: ASANA_ACCESS_TOKEN });

export const createTask = async (workspaceId: string, projectId: string, taskName: string) => {
    try {
        const task = await asanaClient.tasks.create({
            name: taskName,
            workspace: workspaceId,
            projects: [projectId],
        });
        return task;
    } catch (error) {
        throw new Error(`Error creating task: ${error.message}`);
    }
};

export const getTasks = async (projectId: string) => {
    try {
        const tasks = await asanaClient.tasks.findByProject(projectId);
        return tasks;
    } catch (error) {
        throw new Error(`Error fetching tasks: ${error.message}`);
    }
};

export const updateTask = async (taskId: string, updates: object) => {
    try {
        const updatedTask = await asanaClient.tasks.update(taskId, updates);
        return updatedTask;
    } catch (error) {
        throw new Error(`Error updating task: ${error.message}`);
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        await asanaClient.tasks.delete(taskId);
    } catch (error) {
        throw new Error(`Error deleting task: ${error.message}`);
    }
};