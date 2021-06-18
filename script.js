import { uri } from "https://cdn.skypack.dev/mouri";
import mapObject from "https://cdn.skypack.dev/map-obj";

const cls = (vals) =>
  vals.filter((val) => val != null && val != false).join(" ");

function attr(el, name, value) {
  el.hasAttribute(name) && typeof value === "string"
    ? el.setAttribute(name, value)
    : Reflect.set(el, name, value);
}

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => attr(el, k, v));
  attrs.attr &&
    Object.entries(attrs.attr).forEach(([k, v]) => el.setAttribute(k, v));
  el.append(...children);
  return el;
}

const ht = (text, attrs = {}, tag = "div") => h(tag, attrs, [text]);

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - (min - 1)) + min);

const opentdb = async (options) => {
  const url = uri`https://opentdb.com/api.php?${options}`;
  const { results } = await fetch(url).then((res) => res.json());
  return results;
};

const QuestionType = {
  boolean: "True or False",
  multiple: "Multiple Choice",
};

const Question = (props) => {
  const $article = h("article", {}, [
    ht(props.category),
    ht(`${QuestionType[props.questionType]} - ${props.difficulty}`),
    ht(props.question),
    h(
      "ol",
      {},
      props.answers.map((answer, i) =>
        h(
          "li",
          {
            className: cls([
              props.correctAnswer === answer && "correct-answer",
            ]),
          },
          [
            h(
              "span",
              { className: "copyable", attr: { "aria-hidden": true } },
              [`${i + 1}. `]
            ),
            answer,
          ]
        )
      )
    ),
  ]);

  return $article;
};

function decodeQuestion(question) {
  const decoded = mapObject(question, (key, val) => {
    return Array.isArray(val)
      ? [key, val.map((v) => atob(v))]
      : [key, atob(val)];
  });

  const randPos = randomInt(0, decoded.incorrect_answers.length);
  const answers = [...decoded.incorrect_answers];
  answers.splice(randPos, 0, decoded.correct_answer);

  return {
    ...decoded,
    correctAnswer: decoded.correct_answer,
    questionType: decoded.type,
    answers,
  };
}

async function fetchQuestions(amount = 1) {
  const questions = await opentdb({ amount, encode: "base64" });
  return questions.map(decodeQuestion);
}

const $questions = h("div", { className: "questions" });

const $button = h(
  "button",
  {
    onclick: async () => {
      const questions = await fetchQuestions(10);
      $questions.append(...questions.map(Question));
    },
  },
  ["Fetch Question"]
);

document.body.append($button);
document.body.append($questions);
