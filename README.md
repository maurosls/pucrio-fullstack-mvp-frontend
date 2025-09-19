# Easy Diet • PUC Rio

Projeto que será responsável por conter a implementação do Frontend feito com HTML, CSS e Javascript.

Este é o frontend do projeto **Easy Diet**, desenvolvido como parte do MVP da disciplina de Fullstack do curso de Engenharia de Software na PUC-Rio. 
O sistema permite o cadastro de alimentos, registro de refeições diárias e acompanhamento do total de calorias consumidas.

## Funcionalidades

- Visualização do resumo diário de calorias
- Cadastro de novos alimentos com quantidade, unidade e calorias
- Registro de refeições por
- Adição de itens/alimentos às refeições
- Navegação entre dias para consultar refeições anteriores ou futuras

## Tecnologias Utilizadas

- **HTML5** e **CSS3** para estrutura e estilos
- **JavaScript** puro para interatividade e integração com a API backend (Flask)

## Como executar

1. Certifique-se de que o backend Flask está rodando na porta `5000`.
2. Clone este repositório ou baixe os arquivos.
3. Abra o arquivo `index.html` em seu navegador.

## Estrutura dos arquivos

- `index.html`: Página principal do sistema
- `styles.css`: Estilos visuais da aplicação
- `script.js`: Lógica de interação, chamadas à API e manipulação do DOM
- `/img/meal-image.jpg`: Imagem ilustrativa da página

## Observações

- O frontend faz requisições para o backend Flask via HTTP (`http://127.0.0.1:5000`). Certifique-se de que o backend está ativo para o funcionamento completo.
- Para cadastrar alimentos e refeições, utilize os botões na barra superior.
- O sistema calcula automaticamente o total de calorias por dia com base nas refeições registradas.

## Autor
Desenvolvido por Mauro dos Santos para a disciplina de Fullstack básico do curso de Engenharia de Software.