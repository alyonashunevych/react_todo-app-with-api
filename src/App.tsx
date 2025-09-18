import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList/TodoList';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Filter } from './types/Filter';
import { ErrorNotification } from './components/ErrorNotification';
import { ErrorMessage } from './types/ErrorMessage';
import { TodoItem } from './components/TodoItem';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | ''>('');
  const [filter, setFilter] = useState<Filter>(Filter.all);
  const [title, setTitle] = useState('');
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [processings, setProcessings] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<NodeJS.Timeout | null>(null);

  const showError = (message: ErrorMessage) => {
    setErrorMessage(message);

    if (errorTimer.current) {
      clearTimeout(errorTimer.current);
    }

    errorTimer.current = setTimeout(() => {
      setErrorMessage('');
      errorTimer.current = null;
    }, 3000);
  };

  useEffect(() => {
    todoService
      .getTodos()
      .then(setTodos)
      .catch(() => {
        showError(ErrorMessage.load);
      });

    inputRef.current?.focus();
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      return filter === Filter.all
        ? true
        : filter === Filter.completed
          ? todo.completed
          : !todo.completed;
    });
  }, [filter, todos]);

  const activeTodos = useMemo(() => {
    return todos.filter(todo => !todo.completed);
  }, [todos]);

  const completedTodos = useMemo(() => {
    return todos.filter(todo => todo.completed);
  }, [todos]);

  const deleteTodo = (todoId: number) => {
    setErrorMessage('');

    if (!processings.includes(todoId)) {
      setProcessings(ids => [...ids, todoId]);
    }

    return todoService
      .deleteTodo(todoId)
      .then(() =>
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        ),
      )
      .catch(() => {
        showError(ErrorMessage.delete);
      })
      .finally(() => {
        setProcessings(ids => ids.filter(id => id !== todoId));
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  const deleteCompletedTodos = async () => {
    const idsToDelete = completedTodos.map(todo => todo.id);

    setProcessings(ids => [...ids, ...idsToDelete]);

    const results = await Promise.allSettled(
      idsToDelete.map(id => todoService.deleteTodo(id)),
    );

    const successfullyDeletedIds = results
      .map((result, index) =>
        result.status === 'fulfilled' ? idsToDelete[index] : undefined,
      )
      .filter(id => id !== undefined);

    setTodos(current =>
      current.filter(todo => !successfullyDeletedIds.includes(todo.id)),
    );

    setProcessings(ids =>
      ids.filter(id => !successfullyDeletedIds.includes(id)),
    );

    const hasError = results.some(result => result.status === 'rejected');

    if (hasError) {
      showError(ErrorMessage.delete);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const addTodo = () => {
    setErrorMessage('');

    if (!title.trim()) {
      showError(ErrorMessage.empty);

      return Promise.resolve();
    }

    setIsInputDisabled(true);
    setProcessings(ids => [...ids, 0]);

    setTempTodo({
      title: title.trim(),
      id: 0,
      completed: false,
      userId: todoService.USER_ID,
    });

    return todoService
      .addTodo(title.trim())
      .then(newTodo => setTodos(currentTodos => [...currentTodos, newTodo]))
      .catch(() => {
        showError(ErrorMessage.add);

        return Promise.reject();
      })
      .finally(() => {
        setIsInputDisabled(false);
        setTempTodo(undefined);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  const updateTodo = (
    todoId: number,
    completed: boolean,
    newTitle?: string,
  ) => {
    setErrorMessage('');

    if (!processings.includes(todoId)) {
      setProcessings(ids => [...ids, todoId]);
    }

    return todoService
      .updateTodo(todoId, completed, newTitle?.trim())
      .then(todo =>
        setTodos(currentTodos =>
          currentTodos.map(currentTodo =>
            currentTodo.id === todoId ? todo : currentTodo,
          ),
        ),
      )
      .catch(() => {
        showError(ErrorMessage.update);

        return Promise.reject();
      })
      .finally(() => {
        setProcessings(ids => ids.filter(id => id !== todoId));
      });
  };

  const updateAllTodos = async () => {
    const isActiveTodosExist = activeTodos.length > 0;

    const todosToUpdate = isActiveTodosExist ? activeTodos : todos;

    const idsToUpdate = todosToUpdate.map(todo => todo.id);

    setProcessings(ids => [...ids, ...idsToUpdate]);

    const results = await Promise.allSettled(
      idsToUpdate.map(id => todoService.updateTodo(id, isActiveTodosExist)),
    );

    const successfullyUpdatedTodos = results
      .map(result => (result.status === 'fulfilled' ? result.value : undefined))
      .filter((todo): todo is Todo => todo !== undefined);

    setTodos(current =>
      current.map(
        todo => successfullyUpdatedTodos.find(t => t.id === todo.id) || todo,
      ),
    );

    setProcessings(ids =>
      ids.filter(id => !successfullyUpdatedTodos.some(todo => todo.id === id)),
    );

    const hasError = results.some(result => result.status === 'rejected');

    if (hasError) {
      showError(ErrorMessage.update);
    }
  };

  const reset = () => {
    setTitle('');
  };

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          isButtonActive={todos.every(todo => todo.completed)}
          isButtonExists={todos.length > 0}
          inputRef={inputRef}
          title={title}
          isInputDisabled={isInputDisabled}
          onTitleChange={setTitle}
          onAddTodo={addTodo}
          reset={reset}
          onToggleAll={updateAllTodos}
        />

        {filteredTodos && (
          <TodoList
            todos={filteredTodos}
            onDelete={deleteTodo}
            processings={processings}
            onToggleStatus={updateTodo}
            onTitleEdit={updateTodo}
          />
        )}

        {tempTodo && (
          <TodoItem
            todo={tempTodo}
            key={`temp-${tempTodo.id}`}
            onDelete={deleteTodo}
            isProcessed={processings.includes(tempTodo.id)}
            onToggleStatus={updateTodo}
            onTitleEdit={updateTodo}
          />
        )}

        {todos.length !== 0 && activeTodos && (
          <Footer
            numberOfActiveTodos={activeTodos.length}
            filter={filter}
            onFilterChange={setFilter}
            isClearButtonDisabled={todos.every(todo => !todo.completed)}
            onDeleteCompletedTodos={deleteCompletedTodos}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </div>
  );
};
