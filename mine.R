data = read.csv('results_clean.csv')

data.cor = cor(data)

salary.lm = lm(Salary ~ ., data = data)
