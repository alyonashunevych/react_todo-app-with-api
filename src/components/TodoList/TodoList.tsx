import React from 'react';
import { Todo } from '../../types/Todo';
import { TodoItem } from '../TodoItem';

type Props = {
  todos: Todo[];
  onDelete: (todoId: number) => Promise<void>;
  processings: number[];
  onToggleStatus: (todoId: number, completed: boolean) => Promise<void>;
  onTitleEdit: (
    todoId: number,
    completed: boolean,
    newTitle: string,
  ) => Promise<void>;
};

export const TodoList: React.FC<Props> = ({
  todos,
  onDelete,
  processings,
  onToggleStatus,
  onTitleEdit,
}) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoItem
          todo={todo}
          onDelete={onDelete}
          key={todo.id}
          isProcessed={processings.includes(todo.id)}
          onToggleStatus={onToggleStatus}
          onTitleEdit={onTitleEdit}
        />
      ))}
    </section>
  );
};
